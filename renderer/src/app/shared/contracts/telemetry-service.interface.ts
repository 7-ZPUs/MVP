import { AppError } from '../../shared/domain/error.models';
import { TelemetryEvent, TelemetryMetric } from '../../shared/domain/telemetry.enum';

export interface ITelemetry {
  trackEvent(name: TelemetryEvent): void;
  trackTiming(metric: TelemetryMetric, ms: number): void;
  trackError(error: AppError): void;
}
