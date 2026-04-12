export class ExportResult {
    constructor(
        public readonly success: boolean, // successo o fallimento dell'export
        public readonly errorCode?: string, // codice di errore in caso di fallimento
        public readonly errorMessage?: string // messaggio di errore in caso di fallimento
    ) {}

    static ok(): ExportResult {
        return new ExportResult(true);
    }

    static fail(errorCode: string, errorMessage: string): ExportResult {
        return new ExportResult(false, errorCode, errorMessage);
    }
}