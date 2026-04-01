import { Injectable } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
 
@Injectable({ providedIn: 'root' })
export class LiveAnnouncerService {
 
  constructor(private readonly liveAnnouncer: LiveAnnouncer) {}
 
  announce(msg: string, politeness: 'polite' | 'assertive' = 'polite'): void {
    this.liveAnnouncer.announce(msg, politeness);
  }
 
  clear(): void {
    this.liveAnnouncer.clear();
  }
}