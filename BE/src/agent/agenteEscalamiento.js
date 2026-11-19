const { pool } = require('../../config/mysqlClient');

/**
 * Agente de Escalamiento
 * Cuando una duda no tiene respuesta en las políticas o la confianza es baja,
 * crea automáticamente un ticket de RRHH en MySQL para seguimiento humano.
 */
async function escalarCasoRRHH({ colaboradorId, colaboradorNombre, pregunta, motivo = 'Política no encontrada en documentos' }) {
    try {
        console.log(`🎫 [Agente Escalamiento] Creando ticket de RRHH para: ${colaboradorNombre} (${colaboradorId})`);

        // Insertar en la tabla de solicitudes como tipo 'consulta_rrhh' o ticket
        const ticketId = `TCK-${Date.now().toString().slice(-5)}`;
        const hoy = new Date().toISOString().split('T')[0];

        await pool.query(`
            INSERT INTO solicitudes 
            (id, colaborador_id, tipo, fecha_inicio, fecha_fin, estado, aprobador_id)
            VALUES (?, ?, 'consulta_escalada', ?, ?, 'pendiente', 'EMP-001')
        `, [ticketId, colaboradorId || 'EMP-001', hoy, hoy]);

        return {
            exito: true,
            ticketId,
            mensaje: `Hemos generado el ticket de escalamiento **#${ticketId}** para el equipo de Recursos Humanos. Un especialista revisará tu consulta y te contactará a la brevedad.`
        };
    } catch (error) {
        console.error('Error en Agente de Escalamiento:', error);
        return {
            exito: false,
            mensaje: "No se pudo registrar el ticket de escalamiento automáticamente."
        };
    }
}

module.exports = { escalarCasoRRHH };
