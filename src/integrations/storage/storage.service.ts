import { randomUUID } from 'crypto';
import { extname } from 'path';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { S3StorageProvider } from './providers/s3-storage-provider';
import { Prisma, StorageFile } from '@prisma/client';
import { CreateUploadUrlResponse } from './dto/create-upload-url.response';
import { CreateDownloadUrlResponse } from './dto/create-download-url.response';

@Injectable()
export class StorageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageProvider: S3StorageProvider,
  ) {}

  async createUploadUrl(
    key: string,
    mimeType: string,
  ): Promise<CreateUploadUrlResponse>  {
    return {
      uploadUrl: await this.storageProvider.createUploadUrl(
        key,
        mimeType,
      ),
      key,
      expiresIn: this.storageProvider.getSignedUrlExpiry(),
    };
  }

  async completeUpload(
    dto: CompleteUploadDto,
    userId: string,
    prisma: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<StorageFile> {
    const existing = await prisma.storageFile.findUnique({
      where: {
        key: dto.key,
      },
    });

    if (existing) {
      return existing;
    }
    const exists = await this.storageProvider.objectExists(dto.key);

    if (!exists) {
      throw new NotFoundException('Uploaded file not found.');
    }

    return prisma.storageFile.create({
      data: {
        originalName: dto.originalName,
        mimeType: dto.mimeType,
        size: dto.size,
        bucket: this.storageProvider.getBucketName(),
        key: dto.key,
        uploadedById: userId,
      },
    });
  }

  async createDownloadUrl(
    fileId: string
  ): Promise<CreateDownloadUrlResponse> {
    const file = await this.findStorageFileOrThrow(fileId);
    return {
      url: await this.storageProvider.createDownloadUrl(file.key),
    };
  }

  async deleteStorageFile(
    fileId: string,
    prisma: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<void> {
    const file = await this.findStorageFileOrThrow(fileId, prisma);

    await this.storageProvider.deleteObject(file.key);

    await prisma.storageFile.delete({
      where: {
        id: file.id,
      },
    });
  }

  generateObjectKey( 
    path:string,
    filename: string
  ): string {
    const extension = extname(filename);
    return `${path}/${randomUUID()}${extension}`;
  }

  private async findStorageFileOrThrow(
    id: string,
    prisma: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<StorageFile> {
    const file = await prisma.storageFile.findUnique({
      where: {
        id,
      },
    });

    if (!file) {
      throw new NotFoundException('Storage file not found.');
    }

    return file;
  }
}
