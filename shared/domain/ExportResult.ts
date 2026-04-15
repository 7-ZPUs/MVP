export class ExportResult {
  constructor(
    public readonly success: boolean,
    public readonly canceled?: boolean,
    public readonly errorCode?: string,
    public readonly errorMessage?: string,
  ) {}

  static ok(): ExportResult {
    return new ExportResult(true);
  }

  static canceled(): ExportResult {
    return new ExportResult(false, true);
  }

  static fail(errorCode: string, errorMessage: string): ExportResult {
    return new ExportResult(false, false, errorCode, errorMessage);
  }
}