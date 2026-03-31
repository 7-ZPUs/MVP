import { Injectable, Inject } from '@angular/core';
import { ITelemetry, ILoggingChannel, LOGGING_CHANNEL_TOKEN } from '../contracts';
import { AppError, TelemetryEvent, TelemetryMetric, LogLevel, LogEntry } from '../domain';

@Injectable({ providedIn: 'root' })
export class TelemetryService implements ITelemetry {
  constructor(@Inject(LOGGING_CHANNEL_TOKEN) private readonly loggingChannel: ILoggingChannel) {}

  public trackEvent(name: TelemetryEvent): void {
    this.sendToLog(LogLevel.INFO, name, null);
  }

  public trackTiming(metric: TelemetryMetric, ms: number): void {
    this.sendToLog(LogLevel.INFO, metric, { durationMs: ms });
  }

  public trackError(error: AppError): void {
    this.sendToLog(LogLevel.ERROR, 'APP_ERROR', error);
  }

  private sendToLog(level: LogLevel, event: string, payload: unknown): void {
    const entry: LogEntry = {
      level,
      event,
      timestamp: Date.now(),
      payload,
    };

    this.loggingChannel.writeLog(entry).subscribe({
      error: (err) => {
        console.error('Fallimento scrittura telemetria via IPC:', err);
      },
    });
  }
}
