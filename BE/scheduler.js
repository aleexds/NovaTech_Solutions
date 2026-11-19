const cron = require('node-cron');
const { generarReporteDiario } = require('./src/agent/agenteAnalista');
const { sincronizarIndiceDrive } = require('./src/agent/agenteIngesta');

function iniciarCronJobs() {
    console.log('⏰ Inicializando tareas programadas (Cron Jobs) de NovaTech...');

    // 1. Programador Diario a las 7:00 a.m. (Requisito estricto: "se activa cada mañana sin intervención humana a las 7:00 a. m.")
    cron.schedule('0 7 * * *', async () => {
        console.log('⏰ [7:00 AM Cron] Disparando Agente Analista para el reporte diario...');
        try {
            await generarReporteDiario();
            console.log('✅ [7:00 AM Cron] Reporte diario generado y publicado con éxito.');
        } catch (error) {
            console.error('❌ [7:00 AM Cron] Error en reporte diario:', error.message);
        }
    }, {
        scheduled: true,
        timezone: "America/Costa_Rica"
    });

    // 2. Sincronización automática de Google Drive al menos una vez al día (02:00 a.m.)
    cron.schedule('0 2 * * *', async () => {
        console.log('🔄 [2:00 AM Cron] Disparando Agente de Ingesta para sincronizar Google Drive...');
        try {
            await sincronizarIndiceDrive();
            console.log('✅ [2:00 AM Cron] Sincronización de Drive completada.');
        } catch (error) {
            console.error('❌ [2:00 AM Cron] Error sincronizando Drive:', error.message);
        }
    }, {
        scheduled: true,
        timezone: "America/Costa_Rica"
    });

    console.log('✅ Scheduler activo: Agente Analista programado para las 7:00 a.m. y Drive Sync a las 2:00 a.m.');
}

module.exports = { iniciarCronJobs };
