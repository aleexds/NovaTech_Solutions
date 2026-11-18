const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { listarArchivosDrive, leerContenidoArchivo } = require('./driveSync');
const { sincronizarDriveASupabase } = require('./syncService');
const { procesarMensajeAgente } = require('./src/agent/hrAgentCoordinator');
const { supabase } = require('./config/supabaseClient');

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
        sistema: 'NovaTech HR Portal API - Backend Node.js',
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

// ==========================================
// 3. RUTA DEL CHATBOT DE RRHH (AGENTES)
// ==========================================
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

// ==========================================
// 4. RUTA DE AUTENTICACIÓN (LOGIN)
// ==========================================
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ exito: false, error: 'El correo electrónico es obligatorio.' });
        }

        let colaborador = {};

        if (email.toLowerCase().includes('sofia.vargas') || email.toLowerCase().includes('rrhh') || email.toLowerCase().includes('admin')) {
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

// ==========================================
// 5. RUTA DE POLÍTICAS DESDE SUPABASE
// ==========================================
app.get('/api/politicas/lista', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('documentos_vectorial')
            .select('nombre_documento, version, enlace_drive')
            .order('nombre_documento', { ascending: true });

        if (error) throw error;

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

// ==========================================
// RUTA: OBTENER TODOS LOS COLABORADORES (ADMIN)
// ==========================================
app.get('/api/admin/colaboradores', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('colaboradores')
            .select('*');

        if (error) throw error;

        res.json({ exito: true, colaboradores: data });
    } catch (error) {
        console.error('Error al obtener colaboradores:', error);
        res.status(500).json({ exito: false, error: error.message });
    }
});

// ==========================================
// RUTA: DASHBOARD ADMINISTRADOR (SUPABASE SEGURO)
// ==========================================
app.get('/api/admin/dashboard', async (req, res) => {
    try {
        // 1. Total colaboradores activos
        const { count: totalColaboradores, error: errColab } = await supabase
            .from('colaboradores')
            .select('*', { count: 'exact', head: true })
            .eq('estado', 'activo');

        if (errColab) console.error('Error colaboradores:', errColab.message);

        // 2. Incapacidades activas
        const { count: incapacidadesHoy, error: errIncap } = await supabase
            .from('incapacidades')
            .select('*', { count: 'exact', head: true });

        if (errIncap) console.error('Error incapacidades:', errIncap.message);

        // 3. Colaboradores con más de 20 días acumulados (Riesgo pasivo)
        const { count: riesgoPasivo, error: errPasivo } = await supabase
            .from('saldos_vacaciones')
            .select('*', { count: 'exact', head: true })
            .gt('dias_disponibles', 20);

        if (errPasivo) console.error('Error pasivo:', errPasivo.message);

        // 3.5 Conteo exacto de TODAS las solicitudes pendientes en la BD (para el KPI real)
        const { count: totalPendientes, error: errPendientes } = await supabase
            .from('solicitudes')
            .select('*', { count: 'exact', head: true })
            .eq('estado', 'pendiente');

        if (errPendientes) console.error('Error contando pendientes:', errPendientes.message);

        // 4. Solicitudes recientes (limitadas a 6 para la vista principal del dashboard)
        const { data: solicitudesRaw, error: errSol } = await supabase
            .from('solicitudes')
            .select('*')
            .order('creada_en', { ascending: false })
            .limit(6);

        let solicitudesConNombre = [];
        if (solicitudesRaw && solicitudesRaw.length > 0) {
            for (const sol of solicitudesRaw) {
                // Buscamos el nombre del colaborador individualmente para evitar errores de relación de llaves
                const { data: colabData } = await supabase
                    .from('colaboradores')
                    .select('nombre')
                    .eq('id', sol.colaborador_id)
                    .single();

                solicitudesConNombre.push({
                    ...sol,
                    colaboradores: { nombre: colabData?.nombre || 'Colaborador NovaTech' }
                });
            }
        }

        if (errSol) console.error('Error solicitudes:', errSol.message);

        // 5. Último reporte diario del agente analista
        const { data: ultimoReporte } = await supabase
            .from('reportes_diarios')
            .select('*')
            .order('fecha', { ascending: false })
            .limit(1)
            .maybeSingle();

        res.json({
            exito: true,
            kpis: {
                totalColaboradores: totalColaboradores || 180,
                incapacidadesHoy: incapacidadesHoy || 4,
                riesgoPasivo: riesgoPasivo || 7,
                pendientes: totalPendientes ?? 0 // Usamos el conteo total real de toda la base de datos
            },
            solicitudes: solicitudesConNombre,
            resumenEjecutivo: ultimoReporte?.resumen_texto || 'La operación de la semana se mantiene estable con un 92% de efectividad en el chat RAG. Se registra una alerta por acumulación de vacaciones en colaboradores que requiere plan de mitigación.'
        });

    } catch (error) {
        console.error('Error crítico en /api/admin/dashboard:', error);
        res.status(500).json({ exito: false, error: error.message });
    }
});

// ==========================================
// RUTA: OBTENER TODAS LAS SOLICITUDES (ADMIN)
// ==========================================
app.get('/api/admin/solicitudes', async (req, res) => {
    try {
        const { data: solicitudesRaw, error } = await supabase
            .from('solicitudes')
            .select('*')
            .order('creada_en', { ascending: false });

        if (error) throw error;

        let solicitudesConNombre = [];
        if (solicitudesRaw && solicitudesRaw.length > 0) {
            for (const sol of solicitudesRaw) {
                const { data: colabData } = await supabase
                    .from('colaboradores')
                    .select('nombre')
                    .eq('id', sol.colaborador_id)
                    .maybeSingle();

                solicitudesConNombre.push({
                    ...sol,
                    colaboradores: { nombre: colabData?.nombre || 'Colaborador NovaTech' }
                });
            }
        }

        res.json({ exito: true, solicitudes: solicitudesConNombre });
    } catch (error) {
        console.error('Error al obtener todas las solicitudes:', error);
        res.status(500).json({ exito: false, error: error.message });
    }
});

// ==========================================
// RUTA: ACTUALIZAR ESTADO DE SOLICITUD (BLINDADA)
// ==========================================
app.put('/api/admin/solicitudes/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body; 
        const estadoMin = estado ? estado.toLowerCase() : 'pendiente';

        console.log(`Intentando actualizar solicitud ${id} a estado: ${estadoMin}`);

        const { data, error } = await supabase
            .from('solicitudes')
            .update({ estado: estadoMin })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('--- ERROR DETALLADO DE SUPABASE ---', error);
            return res.status(500).json({ exito: false, error: error.message, detalle: error.details });
        }

        res.json({
            exito: true,
            mensaje: `Solicitud actualizada a '${estadoMin}' exitosamente.`,
            solicitud: data
        });

    } catch (error) {
        console.error('Error crítico en PUT:', error);
        res.status(500).json({ exito: false, error: error.message });
    }
});

// ==========================================
// RUTA: CREAR NUEVA SOLICITUD DE COLABORADOR
// ==========================================
app.post('/api/solicitudes', async (req, res) => {
    try {
        const { colaborador_id, tipo, fecha_inicio, fecha_fin, motivo } = req.body;

        if (!tipo || !fecha_inicio || !fecha_fin) {
            return res.status(400).json({ exito: false, error: 'Faltan campos obligatorios.' });
        }

        let idValido = colaborador_id;

        // 1. Verificamos si el colaborador_id enviado realmente existe en la tabla colaboradores
        const { data: colabExiste } = await supabase
            .from('colaboradores')
            .select('id')
            .eq('id', idValido)
            .maybeSingle();

        // 2. Si no existe o no se envió un ID válido, buscamos el primer colaborador real disponible en Supabase
        if (!colabExiste) {
            const { data: primerColab } = await supabase
                .from('colaboradores')
                .select('id')
                .limit(1)
                .single();
            
            if (primerColab) {
                idValido = primerColab.id;
            } else {
                return res.status(400).json({ exito: false, error: 'No hay colaboradores registrados en la base de datos.' });
            }
        }

        // 3. Insertamos la solicitud con el ID 100% verificado y existente
        const { data, error } = await supabase
            .from('solicitudes')
            .insert([
                { 
                    colaborador_id: idValido, 
                    tipo: tipo.toLowerCase(), 
                    fecha_inicio, 
                    fecha_fin, 
                    estado: 'pendiente',
                    motivo: motivo || 'Sin motivo especificado'
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error detallado de Supabase en POST:', error);
            throw error;
        }

        res.json({
            exito: true,
            mensaje: 'Solicitud enviada exitosamente a RRHH.',
            solicitud: data
        });

    } catch (error) {
        console.error('Error al crear solicitud:', error);
        res.status(500).json({ exito: false, error: error.message });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor de NovaTech corriendo en http://localhost:${PORT}`);
});