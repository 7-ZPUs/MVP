import { Injectable } from '@angular/core';
import { AuditLogger } from './audit-logger.service';
 
@Injectable({ providedIn: 'root' })
export class PerformanceMonitor {
 
  constructor(private readonly auditLogger: AuditLogger) {}
 
  async measure(label: string, fn: () => Promise<void>): Promise<void> {
    const start = performance.now();
    await fn();
    const durationMs = Math.round(performance.now() - start);
    this.log(label, durationMs);
  }
 
  log(label: string, durationMs?: number): void {
    this.auditLogger.log({
      action:    'performance',
      context:   label,
      timestamp: new Date(),
      payload:   { durationMs },
    });
  }
}