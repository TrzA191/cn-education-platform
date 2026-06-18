import { BlobServiceClient } from '@azure/storage-blob';
import dotenv from 'dotenv';

dotenv.config();

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;

if (!AZURE_STORAGE_CONNECTION_STRING) {
  console.warn('Advertencia: AZURE_STORAGE_CONNECTION_STRING no está definido en .env');
}

const blobServiceClient = AZURE_STORAGE_CONNECTION_STRING 
  ? BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING)
  : null;

const CONTAINER_NAME = 'videos';

export const uploadFileToBlob = async (
  fileBuffer: Buffer,
  originalName: string,
  mimetype: string
): Promise<string> => {
  if (!blobServiceClient) {
    throw new Error('Azure Storage no está configurado');
  }

  const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
  
  // Asegurar que el contenedor exista y tenga acceso público de lectura para los blobs
  await containerClient.createIfNotExists({
    access: 'blob'
  });

  // Generar un nombre único
  const uniqueName = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const blockBlobClient = containerClient.getBlockBlobClient(uniqueName);

  await blockBlobClient.uploadData(fileBuffer, {
    blobHTTPHeaders: {
      blobContentType: mimetype,
    },
  });

  return blockBlobClient.url;
};
