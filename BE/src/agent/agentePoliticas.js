const { pool } = require('../../config/mysqlClient');
const { consultarDeepSeek } = require('../../services/deepseekService');

/**
 * Agente de Políticas (RAG)
 * Responsabilidad: Responder preguntas de normativas y políticas usando los documentos de Drive indexados en MySQL.
 * Regla: Siempre incluye el nombre del documento, sección y enlace. Si la confianza es baja, admite que no sabe y ofrece escalar.
 */
async function ejecutarAgentePoliticas(consulta) {
    try {
        console.log(`📚 [Agente Políticas RAG] Procesando consulta: "${consulta}"`);

        // Búsqueda en MySQL (FullText Search + LIKE fallback)
        let fragmentos = [];
        try {
            const [ftResults] = await pool.query(`
                SELECT nombre_documento, seccion, version, enlace_drive, contenido,
                       MATCH(contenido, nombre_documento) AGAINST(? IN NATURAL LANGUAGE MODE) AS relevancia
                FROM documentos_vectorial
                WHERE MATCH(contenido, nombre_documento) AGAINST(? IN NATURAL LANGUAGE MODE)
                ORDER BY relevancia DESC
                LIMIT 4;
            `, [consulta, consulta]);
            fragmentos = ftResults;
        } catch (err) {
            console.warn('[Agente Políticas] Fallback fulltext:', err.message);
        }

        if (!fragmentos || fragmentos.length === 0) {
            const palabras = consulta.split(' ').filter(w => w.length > 3).slice(0, 3);
            if (palabras.length > 0) {
                const whereClause = palabras.map(() => 'contenido LIKE ?').join(' OR ');
                const params = palabras.map(p => `%${p}%`);
                const [likeResults] = await pool.query(`
                    SELECT nombre_documento, seccion, version, enlace_drive, contenido
                    FROM documentos_vectorial
                    WHERE ${whereClause}
                    LIMIT 3;
                `, params);
                fragmentos = likeResults;
            }
        }

        // Si no se encuentra información en los documentos
        if (!fragmentos || fragmentos.length === 0) {
            return {
                respuesta: "No he encontrado información sobre esta consulta en las políticas y reglamentos oficiales de NovaTech Solutions S.A. ¿Deseas que escale esta duda con el equipo de Recursos Humanos?",
                documentosCitados: [],
                confianzaAlta: false
            };
        }

        // Contexto para el LLM
        const contextoDocumental = fragmentos.map((f, i) => 
            `[Doc ${i + 1}]: "${f.nombre_documento}" (${f.seccion || 'General'}, Versión ${f.version || '2.0'})\nEnlace: ${f.enlace_drive || 'N/A'}\nContenido: ${f.contenido}`
        ).join('\n\n---\n\n');

        const promptSistema = `Eres el Agente Especialista en Políticas de Recursos Humanos de NovaTech Solutions S.A.
Tu ÚNICA fuente de verdad son los siguientes fragmentos de documentos oficiales de la empresa:

${contextoDocumental}

REGLAS OBLIGATORIAS:
1. Responde de forma clara, profesional y empática basándote EXCLUSIVAMENTE en el texto provisto.
2. NUNCA inventes políticas, cifras o beneficios que no estén explícitamente en los fragmentos.
3. SIEMPRE incluye al final de tu respuesta la cita exacta del documento: Nombre del documento, Sección y el enlace (ej: [Nombre del Documento](enlace)).
4. Si la consulta pide información no cubierta por los documentos, indica con claridad que no se encuentra estipulada en las políticas oficiales y ofrece derivar la consulta al equipo humano de RRHH.`;

        const mensajes = [
            { role: 'system', content: promptSistema },
            { role: 'user', content: consulta }
        ];

        const respuestaLLM = await consultarDeepSeek(mensajes);
        const textoRespuesta = respuestaLLM.content || respuestaLLM;

        const documentosCitados = fragmentos.map(f => f.nombre_documento);

        return {
            respuesta: textoRespuesta,
            documentosCitados: [...new Set(documentosCitados)],
            confianzaAlta: true
        };

    } catch (error) {
        console.error('Error en Agente de Políticas:', error);
        throw error;
    }
}

module.exports = { ejecutarAgentePoliticas };
