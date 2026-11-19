const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { listarArchivosDrive, leerContenidoArchivo } = require('./driveSync');
const { sincronizarDriveAMySQL } = require('./syncService');
const { procesarMensajeAgente } = require('./src/agent/hrAgentCoordinator');
const { generarReporteDiario } = require('./src/agent/agenteAnalista');
const { iniciarCronJobs } = require('./scheduler');
const { pool } = require('./config/mysqlClient');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Iniciar Scheduler de tareas automáticas (7:00 a.m. reporte y 2:00 a.m. sync Drive)
iniciarCronJobs();

// ==========================================
// 1. RUTA RAÍZ
// ==========================================
app.get('/', (req, res) => {
    res.json({
        estado: 'activo',
        sistema: 'NovaTech HR Portal API - Backend Node.js & MySQL',
        empresa: 'NovaTech Solutions S.A.'
    });
});

// ==========================================
// 2. RUTAS DE GOOGLE DRIVE Y RAG
// ==========================================
app.get('/api/drive/test', async (req, res) => {
    try {
        const archivos = await listarArchivosDrive();
        res.json({
            exito: true,
            totalArchivos: archivos.length,
            archivosEncontrados: archivos
        });
    } catch (error) {
        res.status(500).json({ exito: false, error: error.message });
    }
});

app.get('/api/drive/sincronizar', async (req, res) => {
    try {
        const resultado = await sincronizarDriveAMySQL();
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ exito: false, error: error.message });
    }
});

// ==========================================
// 3. CHATBOT MULTIAGENTE
// ==========================================
app.post('/api/chat/hr', async (req, res) => {
    try {
        const { sessionId = 'default-session', mensaje, usuario } = req.body;

        if (!mensaje) {
            return res.status(400).json({ exito: false, error: 'El campo mensaje es obligatorio.' });
        }

        const resultado = await procesarMensajeAgente(sessionId, mensaje, usuario);
        res.json({
            exito: true,
            ...resultado
        });

    } catch (error) {
        res.status(500).json({ exito: false, error: error.message });
    }
});

// ==========================================
// 4. AUTENTICACIÓN (LOGIN)
// ==========================================
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ exito: false, error: 'El correo electrónico es obligatorio.' });
        }

        const emailLimpio = email.toLowerCase().trim();

        let [rows] = await pool.query(
            'SELECT id, nombre, email, departamento, puesto, fecha_ingreso, rol, estado FROM colaboradores WHERE LOWER(email) = ? LIMIT 1;',
            [emailLimpio]
        );

        if (!rows || rows.length === 0) {
            const parte = emailLimpio.split('@')[0].replace(/[._-]/g, ' ');
            const palabras = parte.split(' ').filter(p => p.length > 2);
            
            if (palabras.length > 0) {
                const condiciones = palabras.map(() => 'LOWER(nombre) LIKE ?').join(' AND ');
                const params = palabras.map(p => `%${p}%`);
                const [rowsLike] = await pool.query(
                    `SELECT id, nombre, email, departamento, puesto, fecha_ingreso, rol, estado FROM colaboradores WHERE ${condiciones} LIMIT 1;`,
                    params
                );
                rows = rowsLike;
            }
        }

        if (rows && rows.length > 0) {
            const usuarioBD = rows[0];
            return res.json({
                exito: true,
                mensaje: 'Autenticación exitosa',
                usuario: {
                    id: usuarioBD.id,
                    nombre: usuarioBD.nombre,
                    email: usuarioBD.email || emailLimpio,
                    departamento: usuarioBD.departamento,
                    puesto: usuarioBD.puesto,
                    fecha_ingreso: usuarioBD.fecha_ingreso,
                    rol: usuarioBD.rol,
                    estado: usuarioBD.estado
                }
            });
        }

        res.status(404).json({
            exito: false,
            error: `El colaborador con correo "${email}" no se encuentra registrado en el directorio activo de NovaTech.`
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ exito: false, error: error.message });
    }
});

// ==========================================
// 5. SOLICITUDES DEL COLABORADOR
// ==========================================
app.get('/api/colaborador/solicitudes', async (req, res) => {
    try {
        const { colaborador_id } = req.query;
        if (!colaborador_id) {
            return res.status(400).json({ exito: false, error: 'colaborador_id es obligatorio' });
        }

        const [solicitudes] = await pool.query(`
            SELECT id, tipo, fecha_inicio, fecha_fin, estado, aprobador_id, creada_en
            FROM solicitudes
            WHERE colaborador_id = ?
            ORDER BY creada_en DESC;
        `, [colaborador_id]);

        res.json({
            exito: true,
            total: solicitudes.length,
            solicitudes
        });
    } catch (error) {
        res.status(500).json({ exito: false, error: error.message });
    }
});

app.post('/api/colaborador/solicitudes', async (req, res) => {
    try {
        const { colaborador_id, tipo, fecha_inicio, fecha_fin, motivo } = req.body;

        if (!colaborador_id || !fecha_inicio) {
            return res.status(400).json({ exito: false, error: 'Datos incompletos para registrar la solicitud.' });
        }

        const solicitudId = `SOL-${Date.now().toString().slice(-5)}`;
        const tipoFinal = tipo || 'feriado_laborado';
        const fin = fecha_fin || fecha_inicio;

        await pool.query(`
            INSERT INTO solicitudes (id, colaborador_id, tipo, fecha_inicio, fecha_fin, estado, aprobador_id)
            VALUES (?, ?, ?, ?, ?, 'pendiente', 'EMP-001')
        `, [solicitudId, colaborador_id, tipoFinal, fecha_inicio, fin]);

        res.json({
            exito: true,
            solicitudId,
            mensaje: `Solicitud #${solicitudId} registrada exitosamente.`
        });
    } catch (error) {
        console.error('Error creando solicitud:', error);
        res.status(500).json({ exito: false, error: error.message });
    }
});

// ==========================================
// 6. DIRECTORIO DE COLABORADORES
// ==========================================
app.get('/api/admin/colaboradores', async (req, res) => {
    try {
        const [colaboradores] = await pool.query(`
            SELECT c.*, sv.dias_disponibles, sv.dias_tomados
            FROM colaboradores c
            LEFT JOIN saldos_vacaciones sv ON c.id = sv.colaborador_id
            ORDER BY c.nombre ASC;
        `);

        res.json({
            exito: true,
            total: colaboradores.length,
            colaboradores: colaboradores.map(c => ({
                id: c.id,
                nombre: c.nombre,
                email: c.email || `${c.nombre.toLowerCase().replace(/ /g, '.')}@novatech.com`,
                departamento: c.departamento,
                puesto: c.puesto,
                fecha_ingreso: c.fecha_ingreso,
                rol: c.rol,
                estado: c.estado,
                diasVacaciones: c.dias_disponibles ?? 15
            }))
        });
    } catch (error) {
        res.status(500).json({ exito: false, error: error.message });
    }
});

// ==========================================
// 7. ADMINISTRACIÓN: TODAS LAS SOLICITUDES (Para el Modal "Ver Todas")
// ==========================================
app.get('/api/admin/solicitudes', async (req, res) => {
    try {
        const [solicitudes] = await pool.query(`
            SELECT s.*, c.nombre AS colaborador_nombre, c.departamento, c.email AS colaborador_email
            FROM solicitudes s
            LEFT JOIN colaboradores c ON s.colaborador_id = c.id
            ORDER BY s.creada_en DESC;
        `);

        res.json({
            exito: true,
            total: solicitudes.length,
            solicitudes
        });
    } catch (error) {
        console.error('Error al listar solicitudes en admin:', error);
        res.status(500).json({ exito: false, error: error.message });
    }
});

// ==========================================
// 8. DASHBOARD ADMINISTRATIVO DE RRHH
// ==========================================
app.get('/api/admin/dashboard', async (req, res) => {
    try {
        const [[colabs]] = await pool.query('SELECT COUNT(*) AS total FROM colaboradores WHERE estado = "activo"');
        const [[incap]] = await pool.query('SELECT COUNT(*) AS total FROM incapacidades WHERE fecha_inicio >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)');
        const [[pend]] = await pool.query(`
            SELECT 
                COUNT(*) AS total,
                SUM(CASE WHEN DATEDIFF(CURDATE(), creada_en) > 3 THEN 1 ELSE 0 END) AS mas_3_dias
            FROM solicitudes WHERE estado = "pendiente"
        `);
        const [[riesgo]] = await pool.query('SELECT COUNT(*) AS total FROM saldos_vacaciones WHERE dias_disponibles >= 20');
        
        const [solicitudes] = await pool.query(`
            SELECT s.*, c.nombre AS colaborador_nombre, c.departamento
            FROM solicitudes s
            LEFT JOIN colaboradores c ON s.colaborador_id = c.id
            WHERE s.estado = 'pendiente'
            ORDER BY s.creada_en DESC
            LIMIT 10
        `);

        const [reportes] = await pool.query('SELECT * FROM reportes_diarios ORDER BY fecha DESC LIMIT 7');
        const reporteActual = reportes && reportes.length > 0 ? reportes[0] : null;

        res.json({
            exito: true,
            kpis: {
                totalColaboradores: colabs?.total || 0,
                incapacidadesHoy: incap?.total || 0,
                pendientes: pend?.total || 0,
                pendientesMas3Dias: Number(pend?.mas_3_dias) || 0,
                riesgoPasivo: riesgo?.total || 0
            },
            solicitudes: solicitudes || [],
            resumenEjecutivo: reporteActual?.resumen_texto || "El sistema multiagente de NovaTech Solutions se encuentra monitoreando en tiempo real las ausencias, solicitudes y saldos laborales.",
            reporteActual: reporteActual,
            historialReportes: reportes || []
        });
    } catch (error) {
        res.status(500).json({ exito: false, error: error.message });
    }
});

app.post('/api/admin/ejecutar-reporte-analista', async (req, res) => {
    try {
        const resultado = await generarReporteDiario();
        res.json({ exito: true, ...resultado });
    } catch (error) {
        res.status(500).json({ exito: false, error: error.message });
    }
});

// Soportar tanto PUT como PATCH para cambiar el estado de solicitudes
const actualizarEstadoSolicitud = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        await pool.query('UPDATE solicitudes SET estado = ? WHERE id = ?', [estado, id]);
        res.json({ exito: true, mensaje: `Solicitud #${id} marcada como ${estado}.` });
    } catch (error) {
        res.status(500).json({ exito: false, error: error.message });
    }
};

app.put('/api/admin/solicitudes/:id', actualizarEstadoSolicitud);
app.patch('/api/admin/solicitudes/:id', actualizarEstadoSolicitud);

app.listen(PORT, () => {
    console.log(`🚀 Servidor NovaTech ejecutándose en http://localhost:${PORT} con MySQL`);
});
