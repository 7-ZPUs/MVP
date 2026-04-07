import { Observable } from 'rxjs';
import { LogEntry } from '../../shared/domain/log.enum';
import { InjectionToken } from '@angular/core';

export interface ILoggingChannel {
  writeLog(entry: LogEntry): Observable<void>;
}

export const LOGGING_CHANNEL_TOKEN = new InjectionToken<ILoggingChannel>('ILoggingChannel');
