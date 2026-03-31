export class PrintResult {
    constructor(
        public readonly success: boolean,
        public readonly errorCode?: string,
        public readonly errorMessage?: string
    ) {}

    static ok(): PrintResult {
        return new PrintResult(true);
    }

    static fail(errorCode: string, errorMessage: string): PrintResult {
        return new PrintResult(false, errorCode, errorMessage);
    }
}