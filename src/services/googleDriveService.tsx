import { auth } from '../lib/firebase';

// Cloud Function URL (update after deployment)
const CLOUD_FUNCTION_URL = 'https://europe-west1-alloon.cloudfunctions.net';

/**
 * Upload a file to Google Drive via Cloud Function
 * Uses Service Account - no per-user OAuth needed!
 */
export const uploadInvoiceToDrive = async (
  file: File,
  companyId: string,
  companyName: string,
  userId: string,
  userEmail?: string,
  metadata?: {
    supplierName?: string;
    invoiceNumber?: string;
    amount?: number;
    vatAmount?: number;
    totalAmount?: number;
  },
  ocrData?: any
): Promise<{
  invoiceId: string;
  driveFileId: string;
  driveWebLink: string;
}> => {
  try {
    console.log(`Uploading: ${file.name} for ${companyName}`);

    // Get Firebase Auth token
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Not authenticated');
    }

    const idToken = await currentUser.getIdToken();

    // Prepare form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('companyId', companyId);
    formData.append('companyName', companyName);
    formData.append('folderType', 'Inkoop');
    formData.append('metadata', JSON.stringify({
      supplierName: ocrData?.supplierName || metadata?.supplierName || 'Onbekend',
      invoiceNumber: ocrData?.invoiceNumber || metadata?.invoiceNumber || `INV-${Date.now()}`,
      subtotal: ocrData?.subtotal || metadata?.amount || 0,
      vatAmount: ocrData?.vatAmount || metadata?.vatAmount || 0,
      totalAmount: ocrData?.totalInclVat || metadata?.totalAmount || 0,
      ocrConfidence: ocrData?.confidence || 0,
    }));

    // Call Cloud Function
    const response = await fetch(`${CLOUD_FUNCTION_URL}/uploadToDrive`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${idToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorData.message || errorData.error || 'Upload failed');
    }

    const result = await response.json();
    console.log(`✓ Upload complete: ${result.driveWebLink}`);

    return {
      invoiceId: result.invoiceId,
      driveFileId: result.driveFileId,
      driveWebLink: result.driveWebLink,
    };

  } catch (error) {
    console.error('Error uploading invoice to Drive:', error);
    throw error;
  }
};

/**
 * Check if Google Drive connection is working
 * (Service Account is always connected - just verify the Cloud Function works)
 */
export const checkDriveConnection = async (): Promise<{
  connected: boolean;
  message: string;
  files?: string[];
}> => {
  try {
    const response = await fetch(`${CLOUD_FUNCTION_URL}/driveHealthCheck`);
    const data = await response.json();

    return {
      connected: data.success,
      message: data.message || 'Connected',
      files: data.filesInRoot,
    };
  } catch (error) {
    return {
      connected: false,
      message: 'Could not connect to Cloud Function',
    };
  }
};

// ============================================
// LEGACY FUNCTIONS - Kept for backward compatibility
// These are no longer needed with Service Account
// ============================================

/** @deprecated No longer needed - Service Account handles auth */
export const requestGoogleDriveToken = async (userEmail?: string): Promise<string> => {
  console.warn('requestGoogleDriveToken is deprecated - using Service Account');
  return 'service-account-token';
};

/** @deprecated No longer needed - Service Account handles auth */
export const silentRefreshGoogleToken = async (userId: string, userEmail?: string): Promise<string | null> => {
  console.warn('silentRefreshGoogleToken is deprecated - using Service Account');
  return 'service-account-token';
};

/** @deprecated No longer needed - Service Account handles auth */
export const saveGoogleDriveToken = async (userId: string, token: string) => {
  console.warn('saveGoogleDriveToken is deprecated - using Service Account');
};

/** @deprecated No longer needed - Service Account handles auth */
export const getGoogleDriveToken = async (userId: string): Promise<string | null> => {
  console.warn('getGoogleDriveToken is deprecated - using Service Account');
  return 'service-account-token';
};

/** @deprecated Use Cloud Function instead */
export const findOrCreateFolder = async (
  folderName: string,
  token: string,
  parentFolderId?: string
): Promise<string> => {
  console.warn('findOrCreateFolder is deprecated - Cloud Function handles folders');
  return 'handled-by-cloud-function';
};

/** @deprecated Use Cloud Function instead */
export const uploadFileToDrive = async (
  file: File,
  folderId: string,
  token: string,
  fileName?: string
): Promise<{
  fileId: string;
  webViewLink: string;
  downloadLink: string;
  name: string;
}> => {
  console.warn('uploadFileToDrive is deprecated - use uploadInvoiceToDrive');
  throw new Error('Use uploadInvoiceToDrive instead');
};
