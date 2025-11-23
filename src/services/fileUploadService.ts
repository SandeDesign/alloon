const PROXY_URL = 'https://internedata.nl/proxy2.php';
const BASE_FOLDER = 'FLG-Administratie';

export const uploadFile = async (
  file: File,
  companyName: string,
  folderType: string = 'Inkoop'
): Promise<{ success: boolean; fileUrl: string }> => {
  const formData = new FormData();

  // Send folder path as separate field
  const folderPath = `${BASE_FOLDER}/${companyName}/${folderType}`;
  const timestamp = Date.now();
  const fileName = `${timestamp}_${file.name}`;

  formData.append('file', file);
  formData.append('folder', folderPath);
  formData.append('filename', fileName);

  const response = await fetch(PROXY_URL, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(err.error || 'Upload failed');
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Upload failed');
  }

  return {
    success: true,
    fileUrl: result.url,
  };
};
