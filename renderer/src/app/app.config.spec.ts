import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { appConfig } from './app.config';
import { CACHE_SERVICE_TOKEN } from './shared/contracts';
import { IpcCacheService } from './shared/infrastructure/ipc-cache.service';

describe('appConfig cache providers', () => {
  it('risolve CACHE_SERVICE_TOKEN sulla stessa istanza di IpcCacheService', () => {
    TestBed.configureTestingModule({
      providers: [...appConfig.providers],
    });

    const cacheByToken = TestBed.inject(CACHE_SERVICE_TOKEN);
    const cacheByClass = TestBed.inject(IpcCacheService);

    expect(cacheByToken).toBe(cacheByClass);
  });
});
