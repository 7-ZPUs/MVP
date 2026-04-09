import { InjectionToken } from '@angular/core';
import { AppError } from '../domain/error.models';
import { TelemetryEvent, TelemetryMetric } from '../domain/telemetry.enum';

export interface ITelemetry {
  trackEvent(name: TelemetryEvent): void;
  trackTiming(metric: TelemetryMetric, ms: number): void;
  trackError(error: AppError): void;
}

export const TELEMETRY_TOKEN = new InjectionToken<ITelemetry>('ITelemetry');
