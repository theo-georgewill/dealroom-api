import { randomUUID } from 'crypto';
import { extname } from 'path';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto';
import { CompleteUploadDto } from './dto/complete-upload.dto';
import { PrismaService } from '../../core/prisma/prisma.service';
import { S3StorageProvider } from './providers/s3-storage-provider';

@Injectable()
export class StorageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageProvider: S3StorageProvider,
  ) {}

  private generateObjectKey(dealId: string, filename: string): string {
    const extension = extname(filename);

    return `deals/${dealId}/documents/${randomUUID()}${extension}`;
  }

  async createUploadUrl(dto: CreateUploadUrlDto) {
    const deal = await this.prisma.deal.findUnique({
      where: {
        id: dto.dealId,
      },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found.');
    }

    const key = this.generateObjectKey(dto.dealId, dto.filename);

    const uploadUrl = await this.storageProvider.createUploadUrl(
      key,
      dto.contentType,
    );

    return {
      uploadUrl,
      key,
      expiresIn: this.storageProvider.getSignedUrlExpiry(),
    };
  }

  async completeUpload(dto: CompleteUploadDto, userId: string) {
    const existing = await this.prisma.file.findUnique({
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

    const deal = await this.prisma.deal.findUnique({
      where: {
        id: dto.dealId,
      },
    });

    if (!deal) {
      throw new NotFoundException('Deal not found.');
    }

    return this.prisma.file.create({
      data: {
        originalName: dto.originalName,
        filename: dto.originalName,
        mimeType: dto.contentType,
        size: dto.size,

        bucket: this.storageProvider.getBucketName(),
        key: dto.key,

        uploadedById: userId,
        dealId: dto.dealId,
      },
    });
  }

  async createDownloadUrl(fileId: string) {
    const file = await this.prisma.file.findUnique({
      where: {
        id: fileId,
      },
    });

    if (!file) {
      throw new NotFoundException('File not found.');
    }

    return {
      url: await this.storageProvider.createDownloadUrl(file.key),
    };
  }

  async deleteFile(fileId: string) {
    const file = await this.prisma.file.findUnique({
      where: {
        id: fileId,
      },
    });

    if (!file) {
      throw new NotFoundException('File not found.');
    }

    await this.storageProvider.deleteObject(file.key);

    await this.prisma.file.delete({
      where: {
        id: file.id,
      },
    });
  }
}
