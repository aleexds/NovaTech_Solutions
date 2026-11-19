const { google } = require('googleapis');
const path = require('path');
const { PDFParse } = require('pdf-parse');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const KEYFILEPATH = path.resolve(__dirname, 'config', 'credentials.json');
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });

async function listarArchivosDrive() {
    try {
        const folderId = process.env.DRIVE_FOLDER_ID;
        if (!folderId || folderId.includes('id_de_tu_carpeta')) {
            throw new Error("DRIVE_FOLDER_ID no está configurado con el ID real en el archivo .env");
        }
        
        const res = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType, webViewLink)',
        });
        return res.data.files || [];
    } catch (error) {
        console.error('Error al listar archivos de Drive:', error.message);
        throw error;
    }
}

async function leerContenidoArchivo(fileId, mimeType) {
    try {
        // 1. Si es un documento nativo de Google Docs
        if (mimeType === 'application/vnd.google-apps.document') {
            const res = await drive.files.export({
                fileId: fileId,
                mimeType: 'text/plain',
            }, { responseType: 'text' });
            return res.data;
        }

        // 2. Si es una hoja de cálculo de Google Sheets
        if (mimeType === 'application/vnd.google-apps.spreadsheet') {
            const res = await drive.files.export({
                fileId: fileId,
                mimeType: 'text/csv',
            }, { responseType: 'text' });
            return res.data;
        }

        // 3. Si es un archivo PDF
        if (mimeType === 'application/pdf') {
            const res = await drive.files.get({
                fileId: fileId,
                alt: 'media',
            }, { responseType: 'arraybuffer' });
            
            const buffer = Buffer.from(res.data);
            const parser = new PDFParse({ data: buffer });
            try {
                const pdfData = await parser.getText();
                return pdfData.text;
            } finally {
                await parser.destroy();
            }
        }

        // 4. Otros archivos de texto plano
        const res = await drive.files.get({
            fileId: fileId,
            alt: 'media',
        }, { responseType: 'text' });
        return typeof res.data === 'string' ? res.data : JSON.stringify(res.data);

    } catch (error) {
        console.error(`Error al leer el archivo ${fileId} (${mimeType}):`, error.message);
        throw error;
    }
}

module.exports = { listarArchivosDrive, leerContenidoArchivo };
