const { consultarDeepSeek } = require('../../services/deepseekService.js');
const { hrToolsDefinition, ejecutarHerramienta } = require('./tools');

// Memoria conversacional en memoria RAM (se puede extender a Redis o Supabase)
// Estructura: { sessionId: [ { role: 'user'/'assistant', content: '...' } ] }
const sesionesMemoria = {};

async function procesarMensajeAgente(sessionId, mensajeUsuario) {
    // 1. Inicializar memoria para la sesión si no existe
    if (!sesionesMemoria[sessionId]) {
        sesionesMemoria[sessionId] = [
            {
                role: "system",
                content: "Eres el Asistente Experto de Recursos Humanos de 'NovaTech Solutions S.A.'. Tu trabajo es responder con precisión a las dudas de los empleados utilizando exclusivamente la herramienta de búsqueda en las políticas de la empresa. Si no encuentras la respuesta en las políticas, indícalo amablemente y sugiérele contactar a RRHH. Siempre incluye el enlace al documento original de Drive cuando esté disponible."
            }
        ];
    }

    const historial = sesionesMemoria[sessionId];

    // 2. Agregar mensaje del usuario a la memoria
    historial.push({ role: "user", content: mensajeUsuario });

    // 3. Primera llamada a DeepSeek con las herramientas disponibles
    let respuestaModelo = await consultarDeepSeek(historial, hrToolsDefinition);

    // 4. Verificar si el modelo decidió invocar una herramienta (Tool Call)
    while (respuestaModelo.tool_calls && respuestaModelo.tool_calls.length > 0) {
        // Agregamos la respuesta del asistente con la llamada a la herramienta al historial
        historial.push(respuestaModelo);

        for (const toolCall of respuestaModelo.tool_calls) {
            const nombreTool = toolCall.function.name;
            const argumentos = JSON.parse(toolCall.function.arguments);

            // Ejecutar la herramienta localmente
            const resultadoTool = await ejecutarHerramienta(nombreTool, argumentos);

            // Agregar el resultado de la herramienta al historial como rol 'tool'
            historial.push({
                role: "tool",
                tool_call_id: toolCall.id,
                name: nombreTool,
                content: resultadoTool
            });
        }

        // Volver a llamar a DeepSeek para que procese el resultado de la herramienta
        respuestaModelo = await consultarDeepSeek(historial, hrToolsDefinition);
    }

    // 5. Agregar la respuesta final del asistente a la memoria
    historial.push({ role: "assistant", content: respuestaModelo.content });

    return {
        sessionId,
        respuesta: respuestaModelo.content,
        historialCompleto: historial
    };
}

module.exports = { procesarMensajeAgente };