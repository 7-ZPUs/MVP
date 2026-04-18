import { ExportResult } from "./ExportResult";

export interface ExportFileResults {
    canceled: boolean;
    results: { fileId: number; exportResult: ExportResult }[];
}