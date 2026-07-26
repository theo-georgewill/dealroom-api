export class CreateUploadUrlResponse {
  constructor(
    public readonly uploadUrl: string,
    public readonly key: string,
    public readonly expiresIn: number,
  ) {}
}