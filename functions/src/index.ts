import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { google, drive_v3 } from 'googleapis';
import * as cors from 'cors';
import * as Busboy from 'busboy';

// Initialize Firebase Admin
admin.initializeApp();

// CORS middleware
const corsHandler = cors({ origin: true });

// Root folder ID for FLG-Administratie (shared with service account)
const ROOT_FOLDER_ID = '1EZfv49Cq4HndtSKp_jqd2QCEsw0qVrYr';

// Service Account credentials (set via Firebase Functions secrets)
const SERVICE_ACCOUNT = {
  type: 'service_account',
  project_id: 'alloon',
  private_key_id: '6855692f9b9944b75859ea43bb12ad822c7a1518',
  private_key: process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
  client_email: 'firebase-adminsdk-fbsvc@alloon.iam.gserviceaccount.com',
  client_id: '116088092692294770452',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40alloon.iam.gserviceaccount.com',
};

// Create JWT auth client
function getAuthClient() {
  return new google.auth.JWT(
    SERVICE_ACCOUNT.client_email,
    undefined,
    SERVICE_ACCOUNT.private_key,
    ['https://www.googleapis.com/auth/drive']
  );
}

// Get or create a folder in Google Drive
async function findOrCreateFolder(
  drive: drive_v3.Drive,
  folderName: string,
  parentId: string
): Promise<string> {
  // Search for existing folder
  const response = await drive.files.list({
    q: `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  if (response.data.files && response.data.files.length > 0) {
    return response.data.files[0].id!;
  }

  // Create new folder
  const createResponse = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id',
  });

  return createResponse.data.id!;
}

// Parse multipart form data
function parseMultipartForm(req: functions.https.Request): Promise<{
  file: Buffer;
  filename: string;
  mimetype: string;
  fields: Record<string, string>;
}> {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers });
    const fields: Record<string, string> = {};
    let fileBuffer: Buffer | null = null;
    let filename = '';
    let mimetype = '';

    busboy.on('file', (fieldname, file, info) => {
      filename = info.filename;
      mimetype = info.mimeType;
      const chunks: Buffer[] = [];

      file.on('data', (data) => {
        chunks.push(data);
      });

      file.on('end', () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    busboy.on('field', (fieldname, val) => {
      fields[fieldname] = val;
    });

    busboy.on('finish', () => {
      if (fileBuffer) {
        resolve({ file: fileBuffer, filename, mimetype, fields });
      } else {
        reject(new Error('No file uploaded'));
      }
    });

    busboy.on('error', reject);

    if (req.rawBody) {
      busboy.end(req.rawBody);
    } else {
      req.pipe(busboy);
    }
  });
}

// Main upload function
export const uploadToDrive = functions
  .region('europe-west1')
  .runWith({
    timeoutSeconds: 120,
    memory: '512MB',
    secrets: ['GOOGLE_DRIVE_PRIVATE_KEY'],
  })
  .https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
      // Only allow POST
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
      }

      try {
        // Verify Firebase Auth token
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
          res.status(401).json({ error: 'Unauthorized - no token' });
          return;
        }

        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const userId = decodedToken.uid;

        // Parse the multipart form
        const { file, filename, mimetype, fields } = await parseMultipartForm(req);

        const companyName = fields.companyName || 'Unknown';
        const companyId = fields.companyId || '';
        const folderType = fields.folderType || 'Inkoop'; // Inkoop, Verkoop, Productie
        const metadata = fields.metadata ? JSON.parse(fields.metadata) : {};

        // Initialize Drive API with service account
        const auth = getAuthClient();
        const drive = google.drive({ version: 'v3', auth });

        // Create folder structure: FLG-Administratie / {CompanyName} / {FolderType}
        const companyFolderId = await findOrCreateFolder(drive, companyName, ROOT_FOLDER_ID);
        const typeFolderId = await findOrCreateFolder(drive, folderType, companyFolderId);

        // Generate unique filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const uniqueFilename = `${timestamp}_${filename}`;

        // Upload file
        const { Readable } = require('stream');
        const fileStream = Readable.from(file);

        const uploadResponse = await drive.files.create({
          requestBody: {
            name: uniqueFilename,
            parents: [typeFolderId],
            description: JSON.stringify({
              uploadedBy: userId,
              companyId,
              ...metadata,
            }),
          },
          media: {
            mimeType: mimetype,
            body: fileStream,
          },
          fields: 'id, name, webViewLink, webContentLink',
        });

        // Save to Firestore
        const invoiceRef = admin.firestore().collection('incomingInvoices').doc();
        await invoiceRef.set({
          id: invoiceRef.id,
          driveFileId: uploadResponse.data.id,
          driveWebLink: uploadResponse.data.webViewLink,
          filename: uploadResponse.data.name,
          originalFilename: filename,
          companyId,
          companyName,
          folderType,
          uploadedBy: userId,
          uploadedAt: admin.firestore.Timestamp.now(),
          ...metadata,
        });

        res.status(200).json({
          success: true,
          invoiceId: invoiceRef.id,
          driveFileId: uploadResponse.data.id,
          driveWebLink: uploadResponse.data.webViewLink,
          filename: uploadResponse.data.name,
        });

      } catch (error: any) {
        console.error('Upload error:', error);
        res.status(500).json({
          error: 'Upload failed',
          message: error.message
        });
      }
    });
  });

// Simple health check / test function
export const driveHealthCheck = functions
  .region('europe-west1')
  .https.onRequest(async (req, res) => {
    corsHandler(req, res, async () => {
      try {
        const auth = getAuthClient();
        const drive = google.drive({ version: 'v3', auth });

        // Test: list files in root folder
        const response = await drive.files.list({
          q: `'${ROOT_FOLDER_ID}' in parents and trashed=false`,
          fields: 'files(id, name)',
          pageSize: 10,
        });

        res.status(200).json({
          success: true,
          message: 'Google Drive connection working',
          filesInRoot: response.data.files?.map(f => f.name) || [],
        });

      } catch (error: any) {
        console.error('Health check error:', error);
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    });
  });
