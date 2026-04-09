import { inject, injectable } from 'tsyringe';
import { IPrintFileUC } from '../IPrintFileUC';
import { IFileRepository, FILE_REPOSITORY_TOKEN } from '../../../repo/IFileRepository';
import { IPrintPort, PRINT_PORT_TOKEN } from '../../../repo/IPrintPort';

@injectable()
export class PrintFileUC implements IPrintFileUC {
    constructor(
        @inject(FILE_REPOSITORY_TOKEN)
        private readonly fileRepo: IFileRepository,
        @inject("DIP_PATH_TOKEN")
        private readonly dipPath: string,
        @inject(PRINT_PORT_TOKEN)
        private readonly printPort: IPrintPort
    ) { }

    async execute(fileId: number): Promise<{ success: boolean; error?: string }> {
        const file = this.fileRepo.getById(fileId);
        if (!file) {
            return { success: false, error: `File con id ${fileId} non trovato` };
        }

        const path = require('node:path');
        const absolutePath = path.resolve(this.dipPath, file.getPath());
        return this.printPort.printSingle(absolutePath, { silent: false, printBackground: true });
    }
}