const { pool } = require('../../config/mysqlClient');

// Definición de la herramienta compatible con LLMs
const hrToolsDefinition = [
    {
        type: "function",
        function: {
            name: "buscar_politicas_rrhh",
            description: "Busca información oficial en las políticas de recursos humanos de NovaTech almacenadas en la base de datos de MySQL basándose en la pregunta del empleado.",
            parameters: {
                type: "object",
                properties: {
                    consulta: {
                        type: "string",
                        description: "La pregunta o concepto clave a buscar en los documentos de políticas."
                    }
                },
                required: ["consulta"]
            }
        }
    }
];

// Implementación real de la herramienta sobre MySQL
async function buscarPoliticasRRHH({ consulta }) {
    try {
        console.log(`🔍 [Tool MySQL] Buscando en políticas sobre: "${consulta}"`);

        // Búsqueda en MySQL utilizando MATCH AGAINST (Full-Text Search) o LIKE como fallback
        let rows = [];
        try {
            const [ftResults] = await pool.query(`
                SELECT nombre_documento, seccion, contenido, enlace_drive,
                       MATCH(contenido, nombre_documento) AGAINST(? IN NATURAL LANGUAGE MODE) AS relevancia
                FROM documentos_vectorial
                WHERE MATCH(contenido, nombre_documento) AGAINST(? IN NATURAL LANGUAGE MODE)
                ORDER BY relevancia DESC
                LIMIT 4;
            `, [consulta, consulta]);
            rows = ftResults;
        } catch (ftErr) {
            console.warn('Full-text search fallback:', ftErr.message);
        }

        // Fallback por LIKE si la búsqueda fulltext no devolvió filas
        if (!rows || rows.length === 0) {
            const palabras = consulta.split(' ').filter(w => w.length > 3).slice(0, 3);
            const whereClause = palabras.length > 0
                ? palabras.map(() => 'contenido LIKE ?').join(' OR ')
                : '1=1';
            const params = palabras.map(p => `%${p}%`);

            const [likeResults] = await pool.query(`
                SELECT nombre_documento, seccion, contenido, enlace_drive
                FROM documentos_vectorial
                WHERE ${whereClause}
                LIMIT 3;
            `, params);
            rows = likeResults;
        }

        if (!rows || rows.length === 0) {
            return JSON.stringify({
                mensaje: "No se encontraron políticas directamente relacionadas para esta consulta específica.",
                encontrado: false
            });
        }

        return JSON.stringify(rows);
    } catch (error) {
        console.error('Error en tool buscar_politicas_rrhh con MySQL:', error.message);
        return JSON.stringify({ error: "No se pudo recuperar información de la base de datos MySQL." });
    }
}

async function ejecutarHerramienta(nombreTool, argumentos) {
    if (nombreTool === 'buscar_politicas_rrhh') {
        return await buscarPoliticasRRHH(argumentos);
    }
    throw new Error(`Herramienta desconocida: ${nombreTool}`);
}

module.exports = { hrToolsDefinition, ejecutarHerramienta };
