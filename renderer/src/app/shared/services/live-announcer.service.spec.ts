import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { LiveAnnouncerService } from './live-announcer.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';

describe('LiveAnnouncerService', () => {
  let service: LiveAnnouncerService;
  let mockCdkAnnouncer: any;

  beforeEach(() => {
    mockCdkAnnouncer = {
      announce: vi.fn().mockResolvedValue(undefined),
    };

    TestBed.configureTestingModule({
      providers: [LiveAnnouncerService, { provide: LiveAnnouncer, useValue: mockCdkAnnouncer }],
    });

    service = TestBed.inject(LiveAnnouncerService);
  });

  it('dovrebbe chiamare il CDK LiveAnnouncer con il livello polite omettendo il parametro', () => {
    service.announce('Ricerca completata');

    expect(mockCdkAnnouncer.announce).toHaveBeenCalledWith('Ricerca completata', 'polite');
  });

  it('dovrebbe usare il livello polite come fallback se viene passato esplicitamente undefined (copertura riga 6)', () => {
    service.announce('Ricerca completata', undefined);

    expect(mockCdkAnnouncer.announce).toHaveBeenCalledWith('Ricerca completata', 'polite');
  });

  it('dovrebbe rispettare il livello assertive se esplicitamente richiesto', () => {
    service.announce('Errore di sistema critico', 'assertive');

    expect(mockCdkAnnouncer.announce).toHaveBeenCalledWith(
      'Errore di sistema critico',
      'assertive',
    );
  });
});
