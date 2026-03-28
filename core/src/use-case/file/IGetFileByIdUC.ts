import type { File } from '../../entity/File';

export interface IGetFileByIdUC {
    execute(id: number): File | null;
}
