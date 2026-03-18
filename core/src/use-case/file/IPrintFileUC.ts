import { PrintResult } from '../../value-objects/PrintResult';

export interface IPrintFileUC {
    execute(fileId: number): Promise<PrintResult>;
}