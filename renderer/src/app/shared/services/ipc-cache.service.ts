import { Injectable } from '@angular/core';
import { ICacheService, CacheEntry } from '../contracts';

@Injectable({ providedIn: 'root' })
export class IpcCacheService implements ICacheService {
  private readonly store = new Map<string, CacheEntry>();

  public get<T>(key: string): T | null {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  public set<T>(key: string, value: T, ttlMs: number): void {
    const expiresAt = Date.now() + ttlMs;
    this.store.set(key, { value, expiresAt });
  }

  public invalidate(key: string): void {
    this.store.delete(key);
  }

  public invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }
}
