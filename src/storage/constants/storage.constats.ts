// storage/constants/storage.constants.ts
import { S3StorageProvider } from '../providers/s3-storage-provider';
export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');

providers: [
  {
    provide: STORAGE_PROVIDER,
    useClass: S3StorageProvider,
  },
];
