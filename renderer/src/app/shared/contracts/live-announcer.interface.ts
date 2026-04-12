import { InjectionToken } from '@angular/core';

export interface ILiveAnnouncer {
  announce(message: string, politeness?: 'assertive' | 'polite'): void;
}

export const LIVE_ANNOUNCER_TOKEN = new InjectionToken<ILiveAnnouncer>('ILiveAnnouncer');
