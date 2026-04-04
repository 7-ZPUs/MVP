import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IpcCacheService } from './ipc-cache.service';
import { TestBed } from '@angular/core/testing';

describe('IpcCacheService', () => {
  let cacheService: IpcCacheService;

  beforeEach(() => {
    vi.useFakeTimers();

    TestBed.configureTestingModule({
      providers: [IpcCacheService],
    });

    cacheService = TestBed.inject(IpcCacheService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('dovrebbe salvare e recuperare un valore se non è scaduto', () => {
    cacheService.set('test-key', { id: 1, name: 'Documento' }, 5000);

    const result = cacheService.get<{ id: number; name: string }>('test-key');

    expect(result).toEqual({ id: 1, name: 'Documento' });
  });

  it('dovrebbe restituire null e invalidare la cache se il TTL è scaduto', () => {
    cacheService.set('test-key', 'valore-temporaneo', 2000);

    // Avanziamo il tempo di 2001 millisecondi (esattamente oltre il TTL)
    vi.advanceTimersByTime(2001);

    const result = cacheService.get<string>('test-key');
    expect(result).toBeNull();
  });

  it('dovrebbe restituire null per una chiave mai inserita', () => {
    const result = cacheService.get('chiave-fantasma');
    expect(result).toBeNull();
  });

  it('dovrebbe invalidare esplicitamente una chiave specifica', () => {
    cacheService.set('manual-key', 'dati', 10000);
    cacheService.invalidate('manual-key');

    expect(cacheService.get('manual-key')).toBeNull();
  });

  it('dovrebbe invalidare solo le chiavi che corrispondono a un prefisso (invalidatePrefix)', () => {
    cacheService.set('search/123', 'risultato 1', 10000);
    cacheService.set('search/456', 'risultato 2', 10000);
    cacheService.set('doc/789', 'dati documento', 10000);

    cacheService.invalidatePrefix('search/');

    expect(cacheService.get('search/123')).toBeNull();
    expect(cacheService.get('search/456')).toBeNull();

    expect(cacheService.get('doc/789')).toBe('dati documento');
  });
});
