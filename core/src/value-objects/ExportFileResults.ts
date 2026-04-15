
export interface ExportFileResults {
    canceled: boolean;
    results: { fileId: number; success: boolean; error?: string }[];
}