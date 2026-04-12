import { Injectable } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ILiveAnnouncer } from '../contracts/live-announcer.interface';

@Injectable({ providedIn: 'root' })
export class LiveAnnouncerService implements ILiveAnnouncer {
  constructor(private readonly cdkAnnouncer: LiveAnnouncer) {}

  public announce(message: string, politeness: 'polite' | 'assertive' = 'polite'): void {
    this.cdkAnnouncer.announce(message, politeness);
  }
}
