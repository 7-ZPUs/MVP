import { AppError } from '../domain/error.models';
import { TelemetryEvent, TelemetryMetric } from '../domain/telemetry.enum';

export interface ITelemetryService {
  trackEvent(name: TelemetryEvent): void;
  trackTiming(metric: TelemetryMetric, ms: number): void;
  trackError(error: AppError): void;
}
