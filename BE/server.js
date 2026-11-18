const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { listarArchivosDrive, leerContenidoArchivo } = require('./driveSync');
const { sincronizarDriveAMySQL } = require('./syncService');
const { procesarMensajeAgente } = require('./src/agent/hrAgentCoordinator');
const { pool } = require('./config/mysqlClient');

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());

// ==========================================
// 1. RUTA RAÍZ DE ESTADO
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
            mensaje: 'Conexión con Google Drive exitosa',
            totalArchivos: archivos.length,
            archivosEncontrados: archivos
        });
    } catch (error) {
        res.status(500).json({
            exito: false,
            error: error.message
        });
    }
});

app.get('/api/drive/leer-contenido', async (req, res) => {
    try {
        const archivos = await listarArchivosDrive();
        
        if (archivos.length === 0) {
            return res.json({
                exito: true,
                mensaje: 'La carpeta de Drive está vacía. Sube un documento primero.',
                documentos: []
            });
        }

        const resultadosLectura = [];
        for (const archivo of archivos) {
            const contenido = await leerContenidoArchivo(archivo.id, archivo.mimeType);
            resultadosLectura.push({
                id: archivo.id,
                nombre: archivo.name,
                tipo: archivo.mimeType,
                enlace: archivo.webViewLink,
                caracteresExtraidos: contenido ? contenido.length : 0,
                extracto: contenido ? (contenido.substring(0, 400) + '...') : ''
            });
        }

        res.json({
            exito: true,
            totalProcesados: resultadosLectura.length,
            documentos: resultadosLectura
        });
    } catch (error) {
        res.status(500).json({
            exito: false,
            error: error.message
        });
    }
});

app.get('/api/drive/sincronizar', async (req, res) => {
    try {
        const resultado = await sincronizarDriveAMySQL();
        res.json(resultado);
    } catch (error) {
        res.status(500).json({
            exito: false,
            error: error.message
        });
    }
});

// ==========================================
// 3. RUTA DEL CHATBOT DE RRHH (AGENTES)
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
            sessionId: resultado.sessionId,
            respuesta: resultado.respuesta
        });

    } catch (error) {
        res.status(500).json({
            exito: false,
            error: error.message
        });
    }
});

// ==========================================
// 4. RUTA DE AUTENTICACIÓN (LOGIN) CON MYSQL
// ==========================================
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ exito: false, error: 'El correo electrónico es obligatorio.' });
        }

        // Consultar usuario en MySQL si existe
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
                puesto: esAdmin ? 'Director de RRHH' : 'Especialista de Software',
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
        res.status(500).json({
            exito: false,
            error: error.message
        });
    }
});

// ==========================================
// 5. LISTA DE POLÍTICAS DE RRHH DESDE MYSQL
// ==========================================
app.get('/api/politicas/lista', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT DISTINCT nombre_documento, version, enlace_drive
            FROM documentos_vectorial
            ORDER BY nombre_documento ASC
        `);

        res.json({
            exito: true,
            totalPoliticas: rows.length,
            politicas: rows.map(r => ({
                nombre: r.nombre_documento,
                version: r.version || '1.0',
                enlaceDrive: r.enlace_drive
            }))
        });

    } catch (error) {
        res.status(500).json({
            exito: false,
            error: error.message
        });
    }
});

// ==========================================
// 6. DATOS DEL DASHBOARD ADMINISTRATIVO
// ==========================================
app.get('/api/admin/dashboard', async (req, res) => {
    try {
        const [[colabs]] = await pool.query('SELECT COUNT(*) AS total FROM colaboradores WHERE estado = "activo"');
        const [[incap]] = await pool.query('SELECT COUNT(*) AS total FROM incapacidades WHERE fecha_inicio >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)');
        const [[pend]] = await pool.query('SELECT COUNT(*) AS total FROM solicitudes WHERE estado = "pendiente"');
        const [[riesgo]] = await pool.query('SELECT COUNT(*) AS total FROM saldos_vacaciones WHERE dias_disponibles >= 20');
        
        const [solicitudes] = await pool.query(`
            SELECT s.*, c.nombre AS colaborador_nombre, c.departamento
            FROM solicitudes s
            LEFT JOIN colaboradores c ON s.colaborador_id = c.id
            ORDER BY s.creada_en DESC
            LIMIT 10
        `);

        // Leer el último reporte diario generado si existe
        const [reporte] = await pool.query('SELECT * FROM reportes_diarios ORDER BY fecha DESC LIMIT 1');

        res.json({
            exito: true,
            kpis: {
                totalColaboradores: colabs?.total || 0,
                incapacidadesHoy: incap?.total || 0,
                pendientes: pend?.total || 0,
                riesgoPasivo: riesgo?.total || 0
            },
            solicitudes: solicitudes || [],
            resumenEjecutivo: reporte[0]?.resumen_texto || "El sistema multiagente monitorea en tiempo real las ausencias, solicitudes y saldos acumulados de los colaboradores de NovaTech Solutions."
        });
    } catch (error) {
        res.status(500).json({ exito: false, error: error.message });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor NovaTech ejecutándose en http://localhost:${PORT} con MySQL`);
});
