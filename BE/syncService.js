const { listarArchivosDrive, leerContenidoArchivo } = require('./driveSync');
const { pool } = require('./config/mysqlClient');

// Función para dividir el texto en fragmentos (chunking respetando encabezados o párrafos)
function dividirEnChunks(texto, tamañoMaximo = 800) {
    const chunks = [];
    let inicio = 0;
    while (inicio < texto.length) {
        chunks.push(texto.slice(inicio, inicio + tamañoMaximo));
        inicio += tamañoMaximo;
    }
    return chunks;
}

async function sincronizarDriveAMySQL() {
    try {
        console.log('🔄 Iniciando sincronización de Google Drive a MySQL...');
        const archivos = await listarArchivosDrive();

        if (archivos.length === 0) {
            return { exito: true, mensaje: 'No hay archivos en la carpeta de Drive.' };
        }

        let totalFragmentosGuardados = 0;

        for (const archivo of archivos) {
            console.log(`📄 Procesando archivo: ${archivo.name} (${archivo.mimeType})`);
            const contenidoTexto = await leerContenidoArchivo(archivo.id, archivo.mimeType);

            if (!contenidoTexto || !contenidoTexto.trim()) {
                console.warn(`⚠️ El archivo ${archivo.name} no devolvió texto legible.`);
                continue;
            }

            // Limpiamos versiones anteriores de este archivo en MySQL para evitar duplicados
            await pool.query('DELETE FROM documentos_vectorial WHERE archivo_id = ?', [archivo.id]);

            const chunks = dividirEnChunks(contenidoTexto, 800);

            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];

                await pool.query(`
                    INSERT INTO documentos_vectorial 
                    (archivo_id, nombre_documento, seccion, version, enlace_drive, contenido)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [
                    archivo.id,
                    archivo.name,
                    `Sección ${i + 1}`,
                    '1.0',
                    archivo.webViewLink || '',
                    chunk
                ]);

                totalFragmentosGuardados++;
            }
        }

        console.log(`✅ Sincronización finalizada. ${totalFragmentosGuardados} fragmentos guardados en MySQL.`);
        return {
            exito: true,
            mensaje: `Sincronización completada. Se procesaron ${archivos.length} archivos y se almacenaron ${totalFragmentosGuardados} fragmentos en MySQL.`,
            totalArchivos: archivos.length,
            totalFragmentos: totalFragmentosGuardados
        };

    } catch (error) {
        console.error('❌ Error durante la sincronización a MySQL:', error);
        throw error;
    }
}

module.exports = { sincronizarDriveAMySQL };
