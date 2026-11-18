const { google } = require('googleapis');
const path = require('path');
const { pool } = require('../../config/mysqlClient');
const { leerContenidoArchivo } = require('../../driveSync');

const KEYFILEPATH = path.resolve(__dirname, '..', '..', 'config', 'credentials.json');
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: SCOPES,
});
const drive = google.drive({ version: 'v3', auth });

function dividirEnChunks(texto, tamañoMaximo = 800) {
    const chunks = [];
    let inicio = 0;
    while (inicio < texto.length) {
        chunks.push(texto.slice(inicio, inicio + tamañoMaximo));
        inicio += tamañoMaximo;
    }
    return chunks;
}

/**
 * Agente de Ingesta y Sincronización
 * Responsabilidad:
 * Detectar archivos nuevos, modificados y borrados en Google Drive (mediante changes o listado sincronizado)
 * y mantener actualizado el índice de documentos en MySQL.
 */
async function sincronizarIndiceDrive() {
    try {
        console.log('🔄 [Agente Ingesta] Iniciando detección de cambios en Drive...');
        const folderId = process.env.DRIVE_FOLDER_ID;

        if (!folderId || folderId.includes('id_de_tu_carpeta')) {
            console.warn('DRIVE_FOLDER_ID no configurado; omitiendo sincronización en vivo con Drive.');
            return { exito: false, mensaje: "Carpeta de Drive no configurada" };
        }

        // Listar archivos actuales en Drive
        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType, webViewLink, modifiedTime)',
        });
        const archivosDrive = res.data.files || [];

        // Obtener archivos actualmente registrados en MySQL
        const [archivosEnBD] = await pool.query('SELECT DISTINCT archivo_id FROM documentos_vectorial');
        const idsEnBD = new Set(archivosEnBD.map(r => r.archivo_id));
        const idsEnDrive = new Set(archivosDrive.map(f => f.id));

        // 1. Eliminar archivos que fueron borrados de Drive
        for (const idBD of idsEnBD) {
            if (!idsEnDrive.has(idBD)) {
                console.log(`🗑️ [Agente Ingesta] Archivo eliminado de Drive detectado: ${idBD}. Borrando de MySQL...`);
                await pool.query('DELETE FROM documentos_vectorial WHERE archivo_id = ?', [idBD]);
            }
        }

        // 2. Ingestar y actualizar archivos nuevos o modificados
        let totalFragmentos = 0;
        for (const archivo of archivosDrive) {
            const contenido = await leerContenidoArchivo(archivo.id, archivo.mimeType);
            if (!contenido || !contenido.trim()) continue;

            await pool.query('DELETE FROM documentos_vectorial WHERE archivo_id = ?', [archivo.id]);

            const chunks = dividirEnChunks(contenido, 800);
            for (let i = 0; i < chunks.length; i++) {
                await pool.query(`
                    INSERT INTO documentos_vectorial 
                    (archivo_id, nombre_documento, seccion, version, enlace_drive, contenido)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [
                    archivo.id,
                    archivo.name,
                    `Sección ${i + 1}`,
                    '2.0',
                    archivo.webViewLink || '',
                    chunks[i]
                ]);
                totalFragmentos++;
            }
        }

        console.log(`✅ [Agente Ingesta] Sincronización completada. ${archivosDrive.length} archivos y ${totalFragmentos} fragmentos en MySQL.`);
        return {
            exito: true,
            archivosProcesados: archivosDrive.length,
            fragmentosIndexados: totalFragmentos
        };
    } catch (error) {
        console.error('Error en Agente de Ingesta:', error);
        throw error;
    }
}

module.exports = { sincronizarIndiceDrive };
