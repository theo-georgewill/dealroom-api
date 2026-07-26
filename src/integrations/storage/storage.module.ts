import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { S3StorageProvider } from './providers/s3-storage-provider';

@Module({
  providers: [StorageService, S3StorageProvider],
  exports: [StorageService, S3StorageProvider],
})
export class StorageModule {}
