import { InjectionToken } from '@angular/core';

export interface ICacheService {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttlMs: number): void;
  invalidate(key: string): void;
  invalidatePrefix(prefix: string): void;
}

export const CACHE_SERVICE_TOKEN = new InjectionToken<ICacheService>('ICacheService');

export interface CacheEntry {
  value: unknown;
  expiresAt: number;
}
