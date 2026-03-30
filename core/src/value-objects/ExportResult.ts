export class ExportResult {
    constructor(
        public readonly success: boolean,
        public readonly errorCode?: string,
        public readonly errorMessage?: string
    ) {}

    static ok(): ExportResult {
        return new ExportResult(true);
    }

    static fail(errorCode: string, errorMessage: string): ExportResult {
        return new ExportResult(false, errorCode, errorMessage);
    }
}