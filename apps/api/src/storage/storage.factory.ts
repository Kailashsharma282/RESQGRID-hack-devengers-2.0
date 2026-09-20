import { IStorageService } from './storage.interface';
import { S3StorageService } from './s3-storage.service';
import { LocalStorageService } from './local-storage.service';

let storageInstance: IStorageService | null = null;

export class StorageFactory {
  static getStorageService(): IStorageService {
    if (!storageInstance) {
      const provider = process.env.STORAGE_PROVIDER?.toLowerCase() || 'local';
      const hasAwsKeys = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

      if (provider === 's3' && hasAwsKeys) {
        try {
          storageInstance = new S3StorageService();
        } catch (err) {
          console.warn('[StorageFactory] Could not initialize AWS S3 storage. Falling back to local storage:', err);
          storageInstance = new LocalStorageService();
        }
      } else {
        if (provider === 's3' && !hasAwsKeys) {
          console.warn('[StorageFactory] STORAGE_PROVIDER is set to "s3" but AWS keys are missing. Using local storage.');
        }
        storageInstance = new LocalStorageService();
      }
    }

    return storageInstance;
  }
}
