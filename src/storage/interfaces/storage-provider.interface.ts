export interface StorageProvider {
  createUploadUrl(key: string, contentType: string): Promise<string>;

  createDownloadUrl(key: string): Promise<string>;

  deleteObject(key: string): Promise<void>;

  objectExists(key: string): Promise<boolean>;
}
