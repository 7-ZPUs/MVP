export interface IGetFileContentUC {
    execute(fileId: number): Promise<Buffer>;
}