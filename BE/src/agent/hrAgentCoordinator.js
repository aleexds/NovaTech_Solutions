const { consultarDeepSeek } = require('../../services/deepseekService');
const { ejecutarAgentePoliticas } = require('./agentePoliticas');
const { ejecutarAgenteDatos } = require('./agenteDatos');
const { pool } = require('../../config/mysqlClient');

// Memoria de conversación por sesión
const sesionesMemoria = {};

/**
 * Agente Orquestador (Principal)
 * Responsabilidad:
 * 1. Clasificar la intención de la consulta:
 *    - 'politica' -> Agente de Políticas (RAG)
 *    - 'dato_personal' -> Agente de Datos del Colaborador
 *    - 'mixta' -> Llama a ambos y combina la respuesta
 *    - 'restringida' -> Intento de consultar datos de terceros o salario de otro (¡Debe negarse rotundamente!)
 *    - 'fuera_de_alcance' -> Temas ajenos a RRHH (películas, chistes, etc.)
 * 2. Registrar en la tabla `consultas_chat` para alimentar la analítica del dashboard.
 */
async function procesarMensajeAgente(sessionId = 'default-session', mensajeUsuario, usuarioAutenticado) {
    const inicio = Date.now();
    let intencion = 'politica';
    let agenteUtilizado = 'orquestador';
    let respuestaFinal = '';
    let documentosCitados = [];
    let escalada = false;

    try {
        console.log(`🧭 [Orquestador] Consulta recibida: "${mensajeUsuario}" de usuario: ${usuarioAutenticado?.nombre || 'Invitado'}`);

        // Inicializar memoria de sesión
        if (!sesionesMemoria[sessionId]) {
            sesionesMemoria[sessionId] = [];
        }

        const msgLower = mensajeUsuario.toLowerCase();

        // ==========================================
        // 1. EVALUACIÓN DE SEGURIDAD (PREGUNTAS RESTRINGIDAS #21 y #22)
        // Ningún colaborador puede acceder a datos salariales o privados de un tercero
        // ==========================================
        const esAdmin = usuarioAutenticado?.rol === 'admin_rrhh';
        const preguntaPorTercero = /(cuánto gana|cuanto gana|salario de|sueldo de|días de vacaciones tiene|vacaciones tiene|dias de vacaciones de)/i.test(msgLower) &&
                                  /(compañero|compañera|gerente|director|juan|pedro|ana|carlos|jefe)/i.test(msgLower);

        if (!esAdmin && preguntaPorTercero) {
            intencion = 'restringida';
            agenteUtilizado = 'orquestador';
            respuestaFinal = "Por estrictas políticas de confidencialidad, privacidad de datos y seguridad laboral de NovaTech Solutions S.A., no está permitido divulgar información personal, salarial ni saldos de vacaciones de otros colaboradores.";
            return registrarYResponder(sessionId, usuarioAutenticado, mensajeUsuario, intencion, agenteUtilizado, respuestaFinal, [], false, Date.now() - inicio);
        }

        // ==========================================
        // 2. DETECCIÓN FUERA DE ALCANCE (#24)
        // ==========================================
        const esFueraDeAlcance = /(película|pelicula|receta|chiste|canción|futbol|fútbol|clima en|juego)/i.test(msgLower);
        if (esFueraDeAlcance && !/(rrhh|recursos humanos|trabajo|permiso|politica)/i.test(msgLower)) {
            intencion = 'fuera_de_alcance';
            agenteUtilizado = 'orquestador';
            respuestaFinal = "Soy el asistente corporativo de Recursos Humanos de NovaTech Solutions S.A. Únicamente puedo orientarte en consultas sobre reglamentos, políticas internas de la empresa, beneficios y tus saldos laborales.";
            return registrarYResponder(sessionId, usuarioAutenticado, mensajeUsuario, intencion, agenteUtilizado, respuestaFinal, [], false, Date.now() - inicio);
        }

        // ==========================================
        // 3. CLASIFICACIÓN DE INTENCIÓN (LLM / Reglas)
        // ==========================================
        const promptClasificador = `Clasifica la intención de este mensaje de un empleado en exactamente UNA de estas palabras:
- dato_personal: si pregunta por sus propios saldos de vacaciones, estado de sus solicitudes, su propia fecha de pago o su expediente.
- politica: si pregunta por normativas, días que corresponden por ley, anticipación de trámites, licencias, teletrabajo, beneficios o códigos de conducta.
- mixta: si combina una pregunta de sus datos con una regla general (ej: "¿cuántos días me quedan y puedo pasarlos al otro año?").
- fuera_de_alcance: si no tiene relación con el trabajo ni con RRHH.

Mensaje: "${mensajeUsuario}"
Responde ÚNICAMENTE la palabra de la intención seleccionada.`;

        const respClasificacion = await consultarDeepSeek([
            { role: 'system', content: 'Eres un clasificador de intenciones ultraconciso.' },
            { role: 'user', content: promptClasificador }
        ]);

        const clasificacionTexto = (respClasificacion.content || respClasificacion).trim().toLowerCase();
        
        if (clasificacionTexto.includes('mixta')) intencion = 'mixta';
        else if (clasificacionTexto.includes('dato_personal')) intencion = 'dato_personal';
        else if (clasificacionTexto.includes('fuera_de_alcance')) intencion = 'fuera_de_alcance';
        else intencion = 'politica';

        // ==========================================
        // 4. ENRUTAMIENTO A AGENTES ESPECIALIZADOS
        // ==========================================

        if (intencion === 'dato_personal') {
            agenteUtilizado = 'agente_datos';
            const resDatos = await ejecutarAgenteDatos(mensajeUsuario, usuarioAutenticado);
            respuestaFinal = resDatos.respuesta;

        } else if (intencion === 'politica') {
            agenteUtilizado = 'agente_politicas';
            const resPol = await ejecutarAgentePoliticas(mensajeUsuario);
            respuestaFinal = resPol.respuesta;
            documentosCitados = resPol.documentosCitados || [];
            if (!resPol.confianzaAlta) {
                escalada = true;
            }

        } else if (intencion === 'mixta') {
            // Regla del PDF: El orquestador llama a ambos agentes y combina sus salidas
            agenteUtilizado = 'orquestador_mixto';
            console.log('🔀 [Orquestador] Consulta mixta detectada. Delegando a Agente Datos y Agente Políticas...');

            const [resDatos, resPol] = await Promise.all([
                ejecutarAgenteDatos(mensajeUsuario, usuarioAutenticado),
                ejecutarAgentePoliticas(mensajeUsuario)
            ]);

            documentosCitados = resPol.documentosCitados || [];

            // Combinar con DeepSeek para fluidez
            const promptCombinador = `Un colaborador hizo la consulta: "${mensajeUsuario}"
El Agente de Datos Personales respondió:
${resDatos.respuesta}

El Agente de Políticas de RRHH respondió:
${resPol.respuesta}

Combina de forma armónica ambas respuestas en un único mensaje claro, manteniendo exactas las cifras personales y las citas de las políticas oficiales.`;

            const respCombinada = await consultarDeepSeek([
                { role: 'system', content: 'Eres el coordinador de RRHH de NovaTech.' },
                { role: 'user', content: promptCombinador }
            ]);

            respuestaFinal = respCombinada.content || respCombinada;

        } else {
            respuestaFinal = "Puedo orientarte con las políticas de recursos humanos y tus datos laborales en NovaTech.";
        }

        const latenciaMs = Date.now() - inicio;
        return await registrarYResponder(sessionId, usuarioAutenticado, mensajeUsuario, intencion, agenteUtilizado, respuestaFinal, documentosCitados, escalada, latenciaMs);

    } catch (error) {
        console.error('Error en el Orquestador Multiagente:', error);
        return {
            sessionId,
            respuesta: "Ocurrió un inconveniente al procesar tu solicitud con los agentes. Por favor intenta nuevamente o contacta a RRHH."
        };
    }
}

// Registro en la tabla consultas_chat y actualización de la memoria
async function registrarYResponder(sessionId, usuario, pregunta, intencion, agente, respuesta, docs, escalada, latenciaMs) {
    try {
        await pool.query(`
            INSERT INTO consultas_chat 
            (colaborador_id, pregunta, intencion, agente, documentos_citados, resuelta, escalada, latencia_ms)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            usuario?.id || null,
            pregunta,
            intencion,
            agente,
            docs && docs.length > 0 ? docs.join(', ') : null,
            !escalada,
            escalada,
            latenciaMs
        ]);
    } catch (dbErr) {
        console.warn('No se pudo registrar la consulta en consultas_chat:', dbErr.message);
    }

    if (sesionesMemoria[sessionId]) {
        sesionesMemoria[sessionId].push({ role: 'user', content: pregunta });
        sesionesMemoria[sessionId].push({ role: 'assistant', content: respuesta });
    }

    return {
        sessionId,
        intencion,
        agente,
        respuesta,
        documentosCitados: docs,
        escalada,
        latenciaMs
    };
}

module.exports = { procesarMensajeAgente };
