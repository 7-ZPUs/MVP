export interface PrintFilesResult {
    canceled: boolean;
    results: { fileId: number; success: boolean; error?: string }[];
}

export interface IPrintFilesUC {
    execute( fileIds: number[], onProgress: (current: number, total: number) => void, ): Promise<PrintFilesResult>
}