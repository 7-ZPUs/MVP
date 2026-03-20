import { Observable } from 'rxjs';
import { LogEntry } from '../domain/log.enum';

export interface ILoggingChannel {
  writeLog(entry: LogEntry): Observable<void>;
}
