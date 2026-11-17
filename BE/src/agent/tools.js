const { supabase } = require('../../config/supabaseClient')
const axios = require('axios');

// Definición de las herramientas en formato compatible con LLMs
const hrToolsDefinition = [
    {
        type: "function",
        function: {
            name: "buscar_politicas_rrhh",
            description: "Busca información oficial en las políticas de recursos humanos de NovaTech almacenadas en Supabase basándose en la pregunta del empleado.",
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

// Implementación real de la herramienta
async function buscarPoliticasRRHH({ consulta }) {
    try {
        console.log(`🔍 [Tool] Buscando en Supabase sobre: "${consulta}"`);
        
        // Hacemos una consulta de coincidencia de texto básico o por similitud en la tabla
        const { data, error } = await supabase
            .from('documentos_vectorial')
            .select('nombre_documento, seccion, contenido, enlace_drive')
            .textSearch('contenido', consulta, {
                type: 'websearch',
                config: 'english'
            })
            .limit(3);

        if (error) {
            // Fallback si textSearch falla por configuración de idioma: traemos los primeros registros relevantes
            const { data: fallbackData, error: fallbackError } = await supabase
                .from('documentos_vectorial')
                .select('nombre_documento, seccion, contenido, enlace_drive')
                .limit(3);

            if (fallbackError) throw fallbackError;
            return JSON.stringify(fallbackData);
        }

        if (!data || data.length === 0) {
            // Segundo fallback trayendo todo el contenido disponible para asegurar contexto
            const { data: allData } = await supabase
                .from('documentos_vectorial')
                .select('nombre_documento, seccion, contenido, enlace_drive')
                .limit(5);
            return JSON.stringify(allData || []);
        }

        return JSON.stringify(data);
    } catch (error) {
        console.error('Error en tool buscar_politicas_rrhh:', error.message);
        return JSON.stringify({ error: "No se pudo recuperar información de la base de datos." });
    }
}

// Ejecutor de herramientas por nombre
async function ejecutarHerramienta(nombreTool, argumentos) {
    if (nombreTool === 'buscar_politicas_rrhh') {
        return await buscarPoliticasRRHH(argumentos);
    }
    throw new Error(`Herramienta desconocida: ${nombreTool}`);
}

module.exports = { hrToolsDefinition, ejecutarHerramienta };