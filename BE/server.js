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