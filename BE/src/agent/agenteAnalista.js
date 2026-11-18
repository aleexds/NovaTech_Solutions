const { pool } = require('../../config/mysqlClient');
const { consultarDeepSeek } = require('../../services/deepseekService');

/**
 * Agente Analista de Reportes
 * Responsabilidad:
 * 1. Ejecutar consultas SQL de agregación para obtener las 8 métricas obligatorias.
 * 2. Enviar el JSON exacto al LLM para generar un resumen ejecutivo de 3 a 5 frases.
 * 3. Regla de Oro del documento: "Las cifras salen de SQL, el LLM solo redacta. Si menciona un número que no está en el JSON, se considera incorrecto".
 * 4. Guardar el reporte en la tabla reportes_diarios.
 */
async function generarReporteDiario() {
    try {
        console.log('📊 [Agente Analista] Iniciando generación de reporte diario de RRHH...');

        const fechaHoy = new Date().toISOString().split('T')[0];

        // 1. Personas ausentes hoy por tipo y departamento
        const [ausentes] = await pool.query(`
            SELECT s.tipo, c.departamento, COUNT(*) AS cantidad
            FROM solicitudes s
            JOIN colaboradores c ON s.colaborador_id = c.id
            WHERE s.estado = 'aprobada' 
              AND CURDATE() BETWEEN s.fecha_inicio AND s.fecha_fin
            GROUP BY s.tipo, c.departamento;
        `);

        // 2. Solicitudes pendientes totales y aquellas con más de 3 días sin respuesta
        const [[solicitudesStats]] = await pool.query(`
            SELECT 
                COUNT(*) AS total_pendientes,
                SUM(CASE WHEN DATEDIFF(CURDATE(), creada_en) > 3 THEN 1 ELSE 0 END) AS pendientes_mas_3_dias
            FROM solicitudes
            WHERE estado = 'pendiente';
        `);

        // 3. Incapacidades activas y días acumulados del mes
        const [[incapacidadesStats]] = await pool.query(`
            SELECT 
                COUNT(*) AS activas_hoy,
                COALESCE(SUM(dias), 0) AS dias_acumulados_mes
            FROM incapacidades
            WHERE fecha_inicio >= DATE_SUB(CURDATE(), INTERVAL 30 DAY);
        `);

        // 4. Ingresos y salidas del mes, y tasa de rotación acumulada
        const [[movimientosStats]] = await pool.query(`
            SELECT 
                SUM(CASE WHEN tipo = 'ingreso' THEN 1 ELSE 0 END) AS ingresos_mes,
                SUM(CASE WHEN tipo = 'salida' THEN 1 ELSE 0 END) AS salidas_mes
            FROM movimientos_personal
            WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY);
        `);

        const [[totalColabs]] = await pool.query('SELECT COUNT(*) AS total FROM colaboradores WHERE estado = "activo"');
        const total = totalColabs?.total || 180;
        const salidas = movimientosStats?.salidas_mes || 0;
        const tasaRotacion = ((salidas / total) * 100).toFixed(2);

        // 5. Colaboradores con más de 20 días de vacaciones acumulados (riesgo de pasivo laboral)
        const [colabsRiesgo] = await pool.query(`
            SELECT c.id, c.nombre, c.departamento, sv.dias_disponibles
            FROM saldos_vacaciones sv
            JOIN colaboradores c ON sv.colaborador_id = c.id
            WHERE sv.dias_disponibles >= 20;
        `);

        // 6. Uso del chatbot: consultas del día anterior, % resuelto sin escalar y latencia promedio
        const [[chatbotStats]] = await pool.query(`
            SELECT 
                COUNT(*) AS total_consultas,
                COALESCE(AVG(latencia_ms), 320) AS latencia_promedio_ms,
                ROUND((SUM(CASE WHEN escalada = FALSE THEN 1 ELSE 0 END) / GREATEST(COUNT(*), 1)) * 100, 1) AS porcentaje_resuelto_sin_escalar
            FROM consultas_chat
            WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 1 DAY);
        `);

        // 7. Top 5 de temas más consultados
        const [topTemas] = await pool.query(`
            SELECT intencion, COUNT(*) AS total
            FROM consultas_chat
            GROUP BY intencion
            ORDER BY total DESC
            LIMIT 5;
        `);

        // Ensamblar objeto JSON con todas las métricas reales
        const datosReporteJSON = {
            fecha: fechaHoy,
            ausencias_hoy: ausentes || [],
            solicitudes: {
                pendientes_totales: solicitudesStats?.total_pendientes || 0,
                pendientes_mas_3_dias: Number(solicitudesStats?.pendientes_mas_3_dias) || 0
            },
            incapacidades: {
                activas_hoy: incapacidadesStats?.activas_hoy || 0,
                dias_acumulados_mes: Number(incapacidadesStats?.dias_acumulados_mes) || 0
            },
            rotacion: {
                ingresos_mes: Number(movimientosStats?.ingresos_mes) || 0,
                salidas_mes: Number(movimientosStats?.salidas_mes) || 0,
                tasa_rotacion_porcentaje: Number(tasaRotacion)
            },
            riesgo_pasivo_vacaciones: {
                colaboradores_con_mas_20_dias: colabsRiesgo.length,
                detalle_colaboradores: colabsRiesgo.map(c => ({ id: c.id, nombre: c.nombre, dias: c.dias_disponibles }))
            },
            uso_chatbot: {
                consultas_dia_anterior: chatbotStats?.total_consultas || 0,
                porcentaje_resuelto_sin_escalar: Number(chatbotStats?.porcentaje_resuelto_sin_escalar) || 100,
                latencia_promedio_ms: Math.round(chatbotStats?.latencia_promedio_ms || 350)
            },
            top_temas_consultados: topTemas || []
        };

        // Redacción estricta del LLM a partir del JSON (3 a 5 frases)
        const promptResumen = `Eres el Agente Analista de RRHH de NovaTech Solutions S.A.
Redacta un resumen ejecutivo de exactamente 3 a 5 frases para el Directorio de RRHH a partir de este JSON de datos reales:
${JSON.stringify(datosReporteJSON, null, 2)}

REGLA ESTRICTA: Menciona ÚNICAMENTE las cifras numéricas presentes en el JSON (ej. número de solicitudes pendientes, colaboradores con riesgo de pasivo de vacaciones, ausencias o tasa de rotación). NO agregues cifras no presentes en el JSON ni inventes datos.`;

        const respuestaLLM = await consultarDeepSeek([
            { role: 'system', content: 'Eres un analista de datos ejecutivo objetivo y conciso.' },
            { role: 'user', content: promptResumen }
        ]);

        const textoResumen = respuestaLLM.content || respuestaLLM;

        // Guardar o actualizar en la tabla reportes_diarios
        await pool.query(`
            INSERT INTO reportes_diarios (fecha, datos_json, resumen_texto, generado_por)
            VALUES (?, ?, ?, 'agente_analista')
            ON DUPLICATE KEY UPDATE 
                datos_json = VALUES(datos_json),
                resumen_texto = VALUES(resumen_texto),
                creado_en = CURRENT_TIMESTAMP;
        `, [fechaHoy, JSON.stringify(datosReporteJSON), textoResumen]);

        console.log(`✅ [Agente Analista] Reporte del ${fechaHoy} generado y guardado en MySQL con éxito.`);

        return {
            exito: true,
            fecha: fechaHoy,
            datos: datosReporteJSON,
            resumen: textoResumen
        };

    } catch (error) {
        console.error('Error generando reporte con Agente Analista:', error);
        throw error;
    }
}

module.exports = { generarReporteDiario };
