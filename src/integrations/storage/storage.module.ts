import { Module } from '@nestjs/common';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';
import { S3StorageProvider } from './providers/s3-storage-provider';

@Module({
  controllers: [StorageController],
  providers: [StorageService, S3StorageProvider],
  exports: [StorageService, S3StorageProvider],
})
export class StorageModule {}
