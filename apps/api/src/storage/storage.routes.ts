import { Router, Request, Response } from 'express';
import multer from 'multer';
import { StorageFactory } from './storage.factory';

export const storageRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

// POST /api/storage/upload
storageRouter.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const folder = (req.query.folder as string) || 'emergency-media';
    const storage = StorageFactory.getStorageService();
    const result = await storage.uploadFile(req.file, folder);

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[Storage] Upload error:', error);
    return res.status(500).json({ success: false, message: 'File upload failed: ' + error.message });
  }
});

// POST /api/storage/presigned-url
storageRouter.post('/presigned-url', async (req: Request, res: Response) => {
  try {
    const { filename, contentType = 'image/jpeg', folder = 'emergency-media' } = req.body;
    if (!filename) {
      return res.status(400).json({ success: false, message: 'filename is required.' });
    }

    const storage = StorageFactory.getStorageService();
    const result = await storage.getPresignedUploadUrl(filename, contentType, folder);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('[Storage] Presigned URL error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate presigned upload URL.' });
  }
});

// GET /api/storage/status
storageRouter.get('/status', async (_req: Request, res: Response) => {
  const storage = StorageFactory.getStorageService();
  const provider = storage.getProviderName();

  return res.json({
    success: true,
    provider,
    isS3: provider === 's3',
    bucket: process.env.AWS_S3_BUCKET_NAME || null,
    region: process.env.AWS_REGION || null,
  });
});
