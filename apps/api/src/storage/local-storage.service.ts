import fs from 'fs';
import path from 'path';
import { IStorageService, UploadResult, PresignedUploadUrlResult } from './storage.interface';

export class LocalStorageService implements IStorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(process.env.STORAGE_DIR || './uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
    console.log(`[Storage] LocalStorageService active storing at "${this.uploadDir}".`);
  }

  getProviderName(): 'local' {
    return 'local';
  }

  async uploadFile(file: Express.Multer.File, folder = 'incident-media'): Promise<UploadResult> {
    const targetFolder = path.join(this.uploadDir, folder);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    const ext = path.extname(file.originalname);
    const timestamp = Date.now();
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${timestamp}_${cleanName}${ext}`;
    const filePath = path.join(targetFolder, filename);

    if (file.buffer) {
      fs.writeFileSync(filePath, file.buffer);
    } else if ((file as any).path) {
      fs.copyFileSync((file as any).path, filePath);
    }

    const key = `${folder}/${filename}`;
    const url = `/uploads/${folder}/${filename}`;

    return {
      key,
      url,
      provider: 'local',
      sizeBytes: file.size,
      mimeType: file.mimetype,
    };
  }

  async getPresignedUploadUrl(
    filename: string,
    _contentType: string,
    folder = 'incident-media',
    expiresInSeconds = 900
  ): Promise<PresignedUploadUrlResult> {
    const ext = path.extname(filename);
    const key = `${folder}/${Date.now()}_${path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, '_')}${ext}`;

    // For local dev, upload URL points to local multipart endpoint
    return {
      uploadUrl: `/api/storage/upload?folder=${folder}`,
      key,
      publicUrl: `/uploads/${key}`,
      expiresInSeconds,
    };
  }

  async getPresignedDownloadUrl(key: string): Promise<string> {
    return `/uploads/${key}`;
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.uploadDir, key);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
      }
      return false;
    } catch (err) {
      console.error(`[Storage] Error deleting local file ${key}:`, err);
      return false;
    }
  }
}
