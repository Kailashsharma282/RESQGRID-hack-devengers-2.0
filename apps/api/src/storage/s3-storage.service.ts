import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { IStorageService, UploadResult, PresignedUploadUrlResult } from './storage.interface';
import path from 'path';

export class S3StorageService implements IStorageService {
  private client: S3Client;
  private bucket: string;
  private region: string;
  private endpoint?: string;

  constructor() {
    this.region = process.env.AWS_REGION || 'us-east-1';
    this.bucket = process.env.AWS_S3_BUCKET_NAME || 'resqgrid-emergency-media';
    this.endpoint = process.env.AWS_S3_ENDPOINT || undefined;

    this.client = new S3Client({
      region: this.region,
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
      forcePathStyle: !!this.endpoint, // Useful for MinIO or LocalStack
    });

    console.log(`[Storage] S3StorageService initialized for bucket "${this.bucket}" in region "${this.region}".`);
  }

  getProviderName(): 's3' {
    return 's3';
  }

  async uploadFile(file: Express.Multer.File, folder = 'incident-media'): Promise<UploadResult> {
    const ext = path.extname(file.originalname);
    const timestamp = Date.now();
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const key = `${folder}/${timestamp}_${cleanName}${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.client.send(command);

    // Build public URL or endpoint URL
    const url = this.endpoint
      ? `${this.endpoint}/${this.bucket}/${key}`
      : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

    return {
      key,
      url,
      provider: 's3',
      sizeBytes: file.size,
      mimeType: file.mimetype,
    };
  }

  async getPresignedUploadUrl(
    filename: string,
    contentType: string,
    folder = 'incident-media',
    expiresInSeconds = 900 // 15 minutes
  ): Promise<PresignedUploadUrlResult> {
    const ext = path.extname(filename);
    const key = `${folder}/${Date.now()}_${path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, '_')}${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });

    const publicUrl = this.endpoint
      ? `${this.endpoint}/${this.bucket}/${key}`
      : `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;

    return {
      uploadUrl,
      key,
      publicUrl,
      expiresInSeconds,
    };
  }

  async getPresignedDownloadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await this.client.send(command);
      return true;
    } catch (err) {
      console.error(`[Storage] Failed to delete S3 object ${key}:`, err);
      return false;
    }
  }
}
