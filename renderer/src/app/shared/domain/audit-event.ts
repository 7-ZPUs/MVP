export interface AuditEvent {
  action:    string;
  context:   string;
  timestamp: Date;
  payload?:  Record<string, unknown>;
}