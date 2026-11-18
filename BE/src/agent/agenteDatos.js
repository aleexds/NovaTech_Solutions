const { pool } = require('../../config/mysqlClient');

/**
 * Agente de Datos del Colaborador
 * Responsabilidad: Responder datos personales y cifras exactas consultando la base de datos MySQL.
 * Regla de Oro de Seguridad: SQL de sólo lectura filtradas ESTRICTAMENTE por el ID del usuario autenticado.
 * NUNCA responde políticas generales y NUNCA revela información de otros empleados a usuarios no autorizados.
 */
async function ejecutarAgenteDatos(consulta, usuarioAutenticado) {
    try {
        console.log(`👤 [Agente Datos] Consulta de datos personales para: ${usuarioAutenticado?.nombre || 'Desconocido'} (${usuarioAutenticado?.id})`);

        if (!usuarioAutenticado || !usuarioAutenticado.id) {
            return {
                respuesta: "No pude verificar tu identidad en el sistema. Por favor inicia sesión nuevamente para consultar tus datos personales.",
                exito: false
            };
        }

        const colabId = usuarioAutenticado.id;
        const q = consulta.toLowerCase();

        // 1. Consulta de saldo de vacaciones ("¿cuántos días me quedan?")
        if (q.includes('vacaciones') || q.includes('días me quedan') || q.includes('dias me quedan') || q.includes('saldo')) {
            const [saldos] = await pool.query(`
                SELECT periodo, dias_asignados, dias_tomados, dias_disponibles 
                FROM saldos_vacaciones 
                WHERE colaborador_id = ? 
                ORDER BY periodo DESC LIMIT 1;
            `, [colabId]);

            if (saldos && saldos.length > 0) {
                const s = saldos[0];
                return {
                    respuesta: `Actualmente dispones de **${s.dias_disponibles} días hábiles** de vacaciones para el período ${s.periodo} (de un total de ${s.dias_asignados} asignados, habiendo disfrutado ya ${s.dias_tomados} días).`,
                    cifras: s,
                    exito: true
                };
            } else {
                return {
                    respuesta: "No se encontraron saldos de vacaciones registrados para tu perfil en el período actual.",
                    exito: true
                };
            }
        }

        // 2. Consulta de solicitudes ("¿en qué estado está mi solicitud?", "mis solicitudes")
        if (q.includes('solicitud') || q.includes('permiso') || q.includes('estado')) {
            const [solicitudes] = await pool.query(`
                SELECT id, tipo, fecha_inicio, fecha_fin, estado, creada_en
                FROM solicitudes
                WHERE colaborador_id = ?
                ORDER BY creada_en DESC LIMIT 3;
            `, [colabId]);

            if (solicitudes && solicitudes.length > 0) {
                const lista = solicitudes.map(s => 
                    `- Solicitud #${s.id} (${s.tipo.toUpperCase()}): Estado **${s.estado.toUpperCase()}** desde el ${new Date(s.fecha_inicio).toLocaleDateString()} hasta el ${new Date(s.fecha_fin).toLocaleDateString()}.`
                ).join('\n');

                return {
                    respuesta: `Tus solicitudes más recientes registradas son:\n\n${lista}`,
                    solicitudes,
                    exito: true
                };
            } else {
                return {
                    respuesta: "No tienes solicitudes recientes registradas en el sistema.",
                    exito: true
                };
            }
        }

        // 3. Próximas fechas de pago
        if (q.includes('pago') || q.includes('sueldo') || q.includes('cuándo me pagan') || q.includes('cuando me pagan')) {
            const hoy = new Date();
            const dia = hoy.getDate();
            const mes = hoy.getMonth();
            const anio = hoy.getFullYear();

            let proximoPago;
            if (dia < 15) {
                proximoPago = new Date(anio, mes, 15);
            } else {
                // Último día del mes actual
                proximoPago = new Date(anio, mes + 1, 0);
            }

            // Si cae en fin de semana, se ajusta al viernes
            if (proximoPago.getDay() === 0) proximoPago.setDate(proximoPago.getDate() - 2);
            if (proximoPago.getDay() === 6) proximoPago.setDate(proximoPago.getDate() - 1);

            return {
                respuesta: `Tu próximo pago de nómina está programado para el **${proximoPago.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}**. Recuerda que los pagos se acreditan quincenalmente los días 15 y el último día hábil de cada mes.`,
                exito: true
            };
        }

        // 4. Datos generales del perfil
        const [perfil] = await pool.query(`
            SELECT id, nombre, departamento, puesto, fecha_ingreso, rol
            FROM colaboradores
            WHERE id = ?;
        `, [colabId]);

        if (perfil && perfil.length > 0) {
            const p = perfil[0];
            return {
                respuesta: `Tus datos de expediente:\n- **Nombre:** ${p.nombre}\n- **Puesto:** ${p.puesto}\n- **Departamento:** ${p.departamento}\n- **Fecha de Ingreso:** ${new Date(p.fecha_ingreso).toLocaleDateString()}\n- **Rol:** ${p.rol}`,
                exito: true
            };
        }

        return {
            respuesta: "No pude procesar la consulta específica de datos con los registros actuales de tu perfil.",
            exito: false
        };

    } catch (error) {
        console.error('Error en Agente de Datos:', error);
        throw error;
    }
}

module.exports = { ejecutarAgenteDatos };
