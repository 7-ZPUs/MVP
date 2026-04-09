export interface IPrintFileUC {
    execute(fileId: number): Promise<{ success: boolean; error?: string }>;
}