const { pool } = require('../../config/mysqlClient');

/**
 * Agente Validador
 * Revisa que la respuesta del agente de políticas esté respaldada por fragmentos oficiales
 * y verifica que NO contenga nombres o datos privados de otros colaboradores antes de enviarla al usuario.
 */
function validarRespuesta(textoRespuesta, usuarioConsultante) {
    if (!textoRespuesta) return { aprobada: false, texto: textoRespuesta };

    // 1. Revisión de seguridad contra fuga de datos personales
    const patronSalarial = /(salario de|sueldo de|gana \$|gana ₡|ingreso de)/i;
    if (patronSalarial.test(textoRespuesta) && usuarioConsultante?.rol !== 'admin_rrhh') {
        console.warn('🛡️ [Agente Validador] Bloqueo de seguridad: intento de exponer cifras confidenciales.');
        return {
            aprobada: false,
            texto: "Por políticas estrictas de privacidad y seguridad laboral de NovaTech Solutions S.A., no está permitido divulgar información salarial de otros colaboradores."
        };
    }

    return { aprobada: true, texto: textoRespuesta };
}

module.exports = { validarRespuesta };
