const { listarArchivosDrive, leerContenidoArchivo } = require('./driveSync');
const { supabase } = require('./config/supabaseClient');

// Función auxiliar para dividir el texto en fragmentos (chunking básico por tamaño)
function dividirEnChunks(texto, tamañoMaximo = 800) {
    const chunks = [];
    let inicio = 0;
    while (inicio < texto.length) {
        chunks.push(texto.slice(inicio, inicio + tamañoMaximo));
        inicio += tamañoMaximo;
    }
    return chunks;
}

async function sincronizarDriveASupabase() {
    try {
        console.log('Iniciando sincronización de Google Drive a Supabase...');
        const archivos = await listarArchivosDrive();

        if (archivos.length === 0) {
            return { exito: true, mensaje: 'No hay archivos en la carpeta de Drive.' };
        }

        let totalFragmentosGuardados = 0;

        for (const archivo of archivos) {
            console.log(`Procesando archivo: ${archivo.name} (${archivo.mimeType})`);
            const contenidoTexto = await leerContenidoArchivo(archivo.id, archivo.mimeType);

            console.log(`Caracteres extraídos del archivo: ${contenidoTexto ? contenidoTexto.length : 0}`);

            if (!contenidoTexto || !contenidoTexto.trim()) {
                console.warn(`⚠️ El archivo ${archivo.name} no devolvió texto legible.`);
                continue;
            }

            // Fragmentar el contenido
            const chunks = dividirEnChunks(contenidoTexto, 800);
            console.log(`Total de fragmentos (chunks) generados: ${chunks.length}`);

            // Insertar cada chunk en la tabla documentos_vectorial de Supabase
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];

                const { data, error } = await supabase
                    .from('documentos_vectorial')
                    .insert({
                        nombre_documento: archivo.name,
                        seccion: `Sección ${i + 1}`,
                        version: '1.0',
                        enlace_drive: archivo.webViewLink,
                        contenido: chunk,
                    })
                    .select();

                if (error) {
                    console.error(`❌ Error al insertar chunk ${i + 1} en Supabase:`, error.message);
                } else {
                    console.log(`✅ Chunk ${i + 1} guardado con éxito en Supabase.`);
                    totalFragmentosGuardados++;
                }
            }
        }

        return {
            exito: true,
            mensaje: 'Sincronización e indexación completada',
            archivosProcesados: archivos.length,
            fragmentosGuardados: totalFragmentosGuardados
        };

            } catch (error) {
        console.error('Error general en la sincronización:', error.message);
        throw error;
    }
}

module.exports = { sincronizarDriveASupabase };