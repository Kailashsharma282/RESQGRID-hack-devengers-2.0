export interface UploadResult {
  key: string;
  url: string;
  provider: 's3' | 'local';
  sizeBytes?: number;
  mimeType?: string;
}

export interface PresignedUploadUrlResult {
  uploadUrl: string;
  key: string;
  publicUrl: string;
  expiresInSeconds: number;
}

export interface IStorageService {
  /**
   * Uploads a file buffer/stream to storage
   */
  uploadFile(file: Express.Multer.File, folder?: string): Promise<UploadResult>;

  /**
   * Generates a presigned S3 PUT URL for direct client-to-bucket uploading
   */
  getPresignedUploadUrl(
    filename: string,
    contentType: string,
    folder?: string,
    expiresInSeconds?: number
  ): Promise<PresignedUploadUrlResult>;

  /**
   * Generates a presigned S3 GET URL for secure time-limited media access
   */
  getPresignedDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;

  /**
   * Deletes a file object from storage
   */
  deleteFile(key: string): Promise<boolean>;

  /**
   * Gets the provider name
   */
  getProviderName(): 's3' | 'local';
}
