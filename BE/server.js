const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { listarArchivosDrive, leerContenidoArchivo } = require('./driveSync');
const { sincronizarDriveAMySQL } = require('./syncService');
const { procesarMensajeAgente } = require('./src/agent/hrAgentCoordinator');
const { generarReporteDiario } = require('./src/agent/agenteAnalista');
const { pool } = require('./config/mysqlClient');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

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

        const [rows] = await pool.query('SELECT * FROM colaboradores WHERE id = ? OR nombre LIKE ? LIMIT 1', [
            email.split('@')[0],
            `%${email.split('@')[0]}%`
        ]);

        let colaborador = {};
        if (rows && rows.length > 0) {
            colaborador = rows[0];
        } else {
            const esAdmin = email.toLowerCase().includes('admin') || email.toLowerCase().includes('rrhh');
            colaborador = {
                id: esAdmin ? 'EMP-001' : 'EMP-' + Math.floor(100 + Math.random() * 900),
                nombre: esAdmin ? 'Carlos Valenzuela' : email.split('@')[0].replace('.', ' ').toUpperCase(),
                departamento: esAdmin ? 'Recursos Humanos' : 'Tecnología',
                puesto: esAdmin ? 'Director de RRHH' : 'Senior Software Engineer',
                fecha_ingreso: '2023-01-15',
                rol: esAdmin ? 'admin_rrhh' : 'colaborador',
                estado: 'activo'
            };
        }

        res.json({
            exito: true,
            mensaje: 'Autenticación exitosa',
            usuario: colaborador
        });

    } catch (error) {
        res.status(500).json({ exito: false, error: error.message });
    }
});

// ==========================================
// 5. DIRECTORIO DE COLABORADORES
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
                email: `${c.nombre.toLowerCase().replace(/ /g, '.')}@novatech.com`,
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
// 6. DASHBOARD ADMINISTRATIVO DE RRHH
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

        // Leer los últimos reportes generados
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

// Generar nuevo reporte manual con el Agente Analista
app.post('/api/admin/ejecutar-reporte-analista', async (req, res) => {
    try {
        const resultado = await generarReporteDiario();
        res.json({ exito: true, ...resultado });
    } catch (error) {
        res.status(500).json({ exito: false, error: error.message });
    }
});

// Cambiar estado de solicitudes (Aprobar / Rechazar)
app.patch('/api/admin/solicitudes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body; // 'aprobada' o 'rechazada'

        await pool.query('UPDATE solicitudes SET estado = ? WHERE id = ?', [estado, id]);
        res.json({ exito: true, mensaje: `Solicitud #${id} marcada como ${estado}.` });
    } catch (error) {
        res.status(500).json({ exito: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor NovaTech ejecutándose en http://localhost:${PORT} con MySQL`);
});
