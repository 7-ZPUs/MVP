import { ExportFileResults } from "../../../../shared/domain/ExportFileResults"

export interface IPrintFilesUC {
    execute( fileIds: number[], onProgress: (current: number, total: number) => void, ): Promise<ExportFileResults>
}