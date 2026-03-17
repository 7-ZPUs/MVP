import { CreateFileDTO } from '../../dto/FileDTO';
import type { File } from '../../entity/File';

export interface ICreateFileUC {
    execute(dto: CreateFileDTO): File;
}
