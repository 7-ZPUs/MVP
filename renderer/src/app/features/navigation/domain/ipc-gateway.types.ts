export interface IpcResponse<T> {
    data: T;
    error?: string;
}
  
export type CachePolicy = 'cache-first' | 'network-only';