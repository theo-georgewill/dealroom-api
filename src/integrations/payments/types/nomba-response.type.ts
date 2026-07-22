export interface NombaResponse<T> {
  code: string;
  description: string;
  data: T;
}
