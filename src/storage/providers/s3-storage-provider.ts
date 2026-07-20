import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly signedUrlExpiry: number;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.getOrThrow<string>('R2_BUCKET_NAME');

    this.client = new S3Client({
      region: this.configService.getOrThrow<string>('R2_REGION'),
      endpoint: this.configService.getOrThrow<string>('R2_ENDPOINT'),
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('R2_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow<string>(
          'R2_SECRET_ACCESS_KEY',
        ),
      },
    });

    this.signedUrlExpiry = Number(
      this.configService.get('R2_SIGNED_URL_EXPIRY', '300'),
    );
  }

  getBucketName(): string {
    return this.bucket;
  }

  getSignedUrlExpiry(): number {
    return this.signedUrlExpiry;
  }

  /**
   * Generates a pre-signed URL for uploading an object.
   */
  async createUploadUrl(
    key: string,
    contentType: string,
    expiresIn = this.signedUrlExpiry,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(this.client, command, {
      expiresIn,
    });
  }

  /**
   * Generates a pre-signed URL for downloading an object.
   */
  async createDownloadUrl(
    key: string,
    expiresIn = this.signedUrlExpiry,
  ): Promise<string> {
    const exists = await this.objectExists(key);

    if (!exists) {
      throw new NotFoundException('File not found.');
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, {
      expiresIn,
    });
  }

  /**
   * Deletes an object from storage.
   */
  async deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.client.send(command);
  }

  /**
   * Checks whether an object exists.
   */
  async objectExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);

      return true;
    } catch (error: any) {
      if (
        error?.name === 'NotFound' ||
        error?.$metadata?.httpStatusCode === 404
      ) {
        return false;
      }

      throw error;
    }
  }
}
