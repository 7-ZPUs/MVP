import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LiveAnnouncerService } from './live-announcer.service';
import { LiveAnnouncer } from '@angular/cdk/a11y';

describe('LiveAnnouncerService', () => {
  let service: LiveAnnouncerService;
  let mockCdkAnnouncer: Partial<LiveAnnouncer>;

  beforeEach(() => {
    mockCdkAnnouncer = {
      announce: vi.fn().mockResolvedValue(undefined),
    };

    service = new LiveAnnouncerService(mockCdkAnnouncer as LiveAnnouncer);
  });

  it('dovrebbe chiamare il CDK LiveAnnouncer con il livello polite di default', () => {
    service.announce('Ricerca completata');

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
