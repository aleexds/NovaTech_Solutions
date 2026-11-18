const fs = require('fs');
const path = require('path');
const { pool } = require('../config/mysqlClient');

function dividirEnChunks(texto, tamañoMaximo = 800) {
    const chunks = [];
    let inicio = 0;
    while (inicio < texto.length) {
        chunks.push(texto.slice(inicio, inicio + tamañoMaximo));
        inicio += tamañoMaximo;
    }
    return chunks;
}

async function cargarPoliticasLocalesEnMySQL() {
    try {
        const dir = path.join(__dirname, '..', '..', 'Documentos_Drive');
        const archivos = fs.readdirSync(dir).filter(f => f.endsWith('.txt'));

        console.log(`📁 Encontrados ${archivos.length} documentos locales de políticas.`);

        let totalChunks = 0;

        for (const archivo of archivos) {
            const contenido = fs.readFileSync(path.join(dir, archivo), 'utf8');
            const nombreLimpio = archivo.replace(/^\d+_/, '').replace('.txt', '').replace(/_/g, ' ');

            // Borrar versión previa
            await pool.query('DELETE FROM documentos_vectorial WHERE archivo_id = ?', [archivo]);

            const chunks = dividirEnChunks(contenido, 800);

            for (let i = 0; i < chunks.length; i++) {
                await pool.query(`
                    INSERT INTO documentos_vectorial 
                    (archivo_id, nombre_documento, seccion, version, enlace_drive, contenido)
                    VALUES (?, ?, ?, ?, ?, ?)
                `, [
                    archivo,
                    nombreLimpio,
                    `Sección ${i + 1}`,
                    '2.0',
                    'https://drive.google.com/drive/folders/novatech-hr-docs',
                    chunks[i]
                ]);
                totalChunks++;
            }
            console.log(`  -> ${nombreLimpio}: ${chunks.length} fragmentos indexados.`);
        }

        console.log(`🎉 ¡Carga inicial completada! Total: ${totalChunks} fragmentos listos en MySQL.`);
        process.exit(0);
    } catch (error) {
        console.error('Error indexando políticas locales:', error);
        process.exit(1);
    }
}

cargarPoliticasLocalesEnMySQL();
