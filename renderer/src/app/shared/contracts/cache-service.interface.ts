export interface ICacheService {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttlMs: number): void;
  invalidate(key: string): void;
  invalidatePrefix(prefix: string): void;
}
