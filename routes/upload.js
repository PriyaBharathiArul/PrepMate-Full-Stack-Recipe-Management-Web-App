import express from 'express';
import multer from 'multer';
import { BlobServiceClient } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING
    );
    const containerClient = blobServiceClient.getContainerClient(
      process.env.AZURE_STORAGE_CONTAINER_NAME
    );

    // generate unique file name
    const ext = req.file.originalname.split('.').pop();
    const blobName = `${uuidv4()}.${ext}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // upload to Azure Blob
    await blockBlobClient.uploadData(req.file.buffer, {
      blobHTTPHeaders: { blobContentType: req.file.mimetype }
    });

    return res.json({ url: blockBlobClient.url });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Upload failed.', error: err.message });
  }
});

export default router;