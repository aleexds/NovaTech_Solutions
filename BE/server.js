const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { listarArchivosDrive, leerContenidoArchivo } = require('./driveSync');

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta raíz de estado del servidor
app.get('/', (req, res) => {
    res.json({
        estado: 'activo',
        sistema: 'NovaTech HR Portal API - Backend Node.js',
        empresa: 'NovaTech Solutions S.A.'
    });
});

// Ruta 1: Verificar conexión y listar archivos en la carpeta de Drive
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

// Ruta 2: Extraer y previsualizar el texto de todos los documentos en Drive
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
                caracteresExtraidos: contenido.length,
                extracto: contenido.substring(0, 400) + '...'
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

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor de NovaTech corriendo en http://localhost:${PORT}`);
});

const { sincronizarDriveASupabase } = require('./syncService');

// Ruta para ejecutar la sincronización de Drive a Supabase
app.get('/api/drive/sincronizar', async (req, res) => {
    try {
        const resultado = await sincronizarDriveASupabase();
        res.json(resultado);
    } catch (error) {
        res.status(500).json({
            exito: false,
            error: error.message
        });
    }
});

const { procesarMensajeAgente } = require('./src/agent/hrAgentCoordinator');

// Ruta para chatear con el Agente de RRHH de NovaTech
app.post('/api/chat/hr', async (req, res) => {
    try {
        const { sessionId = 'default-session', mensaje } = req.body;

        if (!mensaje) {
            return res.status(400).json({ exito: false, error: 'El campo mensaje es obligatorio.' });
        }

        const resultado = await procesarMensajeAgente(sessionId, mensaje);
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

// Ruta para simular el inicio de sesión y obtener el perfil del colaborador
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ exito: false, error: 'El correo electrónico es obligatorio.' });
        }

        // Simulamos la base de datos de los 180 colaboradores de NovaTech Solutions S.A.
        // Si el correo es de RRHH, le damos privilegios especiales; si no, rol de colaborador estándar.
        let colaborador = {};

        if (email.toLowerCase().includes('sofia.vargas') || email.toLowerCase().includes('rrhh')) {
            colaborador = {
                id: 'EMP-001',
                nombre: 'Sofía Vargas',
                correo: email,
                puesto: 'Gerente de RRHH',
                departamento: 'Recursos Humanos',
                rol: 'admin_rrhh',
                permisosEdicion: true
            };
        } else {
            // Colaborador estándar de NovaTech
            colaborador = {
                id: 'EMP-' + Math.floor(100 + Math.random() * 900),
                nombre: email.split('@')[0].replace('.', ' ').toUpperCase(),
                correo: email,
                puesto: 'Desarrollador / Especialista Técnico',
                departamento: 'Tecnología',
                rol: 'colaborador',
                permisosEdicion: false
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

const { supabase } = require('./config/supabaseClient');

// Ruta para listar las políticas de RRHH disponibles en la base de datos vectorial
app.get('/api/politicas/lista', async (req, res) => {
    try {
        // Obtenemos los documentos únicos almacenados en Supabase
        const { data, error } = await supabase
            .from('documentos_vectorial')
            .select('nombre_documento, version, enlace_drive')
            .order('nombre_documento', { ascending: true });

        if (error) throw error;

        // Filtramos para mostrar una lista limpia sin duplicados por chunks
        const politicasUnicas = [];
        const nombresVistos = new Set();

        for (const item of (data || [])) {
            if (!nombresVistos.has(item.nombre_documento)) {
                nombresVistos.add(item.nombre_documento);
                politicasUnicas.push({
                    nombre: item.nombre_documento,
                    version: item.version || '1.0',
                    enlaceDrive: item.enlace_drive
                });
            }
        }

        res.json({
            exito: true,
            totalPoliticas: politicasUnicas.length,
            politicas: politicasUnicas
        });

    } catch (error) {
        res.status(500).json({
            exito: false,
            error: error.message
        });
    }
});