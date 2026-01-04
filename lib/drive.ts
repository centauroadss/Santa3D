// lib/drive.ts - Google Drive Storage
import { google } from 'googleapis';
import { Readable } from 'stream';

// Configurar cliente de Google Drive con Service Account
// Las credenciales deben estar en una variable de entorno como JSON string o variables individuales
const getDriveClient = () => {
    try {
        const credentials = JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS || '{}');

        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/drive.file'],
        });

        return google.drive({ version: 'v3', auth });
    } catch (error) {
        console.error('Error initializing Google Drive client:', error);
        throw new Error('Failed to initialize Google Drive client');
    }
};

const getFolderId = (input: string) => {
    // Si es una URL completa, extraemos el ID
    if (input.includes('drive.google.com')) {
        const match = input.match(/folders\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
            return match[1];
        }
    }
    // Si no parece URL, asumimos que es el ID directo
    return input;
};

const RAW_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || '1_zl0FuA-bPmEirqi5lYkdfgsGsk8-BlY';
const DRIVE_FOLDER_ID = getFolderId(RAW_FOLDER_ID);

export interface DriveFile {
    id: string;
    name: string;
    webViewLink: string;
    webContentLink: string;
}

/**
 * Sube un archivo a Google Drive
 * @param fileStream Stream del archivo
 * @param fileName Nombre del archivo
 * @param mimeType Tipo MIME
 */
export async function uploadFileToDrive(
    fileStream: Readable,
    fileName: string,
    mimeType: string
): Promise<DriveFile> {
    const drive = getDriveClient();

    try {
        const response = await drive.files.create({
            requestBody: {
                name: fileName,
                parents: [DRIVE_FOLDER_ID],
            },
            media: {
                mimeType,
                body: fileStream,
            },
            fields: 'id, name, webViewLink, webContentLink',
            supportsAllDrives: true, // Essential for Shared Drives
        });

        return response.data as DriveFile;
    } catch (error) {
        console.error('Error uploading to Drive:', error);
        throw error;
    }
}

/**
 * Elimina un archivo de Google Drive
 * @param fileId ID del archivo en Drive
 */
export async function deleteFileFromDrive(fileId: string): Promise<void> {
    const drive = getDriveClient();
    try {
        await drive.files.delete({
            fileId,
        });
    } catch (error) {
        console.error('Error deleting from Drive:', error);
        throw error;
    }
}
