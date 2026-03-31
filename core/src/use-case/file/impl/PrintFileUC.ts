import { inject, injectable } from 'tsyringe';
import { IPrintFileUC } from '../IPrintFileUC';
import { IFileRepository, FILE_REPOSITORY_TOKEN } from '../../../repo/IFileRepository';
import { PrintResult } from '../../../value-objects/PrintResult';

@injectable()
export class PrintFileUC implements IPrintFileUC {
    constructor(
        @inject(FILE_REPOSITORY_TOKEN)
        private readonly fileRepo: IFileRepository
    ) {}

    async execute(fileId: number): Promise<PrintResult> {
        const file = this.fileRepo.getById(fileId);
        if (!file) {
            return PrintResult.fail('NOT_FOUND', `File con id ${fileId} non trovato`);
        }
        return this.fileRepo.printFile(file.getPath());
    }
}