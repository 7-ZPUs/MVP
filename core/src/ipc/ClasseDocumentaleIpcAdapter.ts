/**
 * ClasseDocumentaleIpcAdapter — Inbound Adapter (IPC)
 *
 * Registra su ipcMain i channel per ClasseDocumentale.
 * Non contiene business logic: delega tutto agli use case.
 *
 * Flusso:
 *   Renderer ipcRenderer.invoke(channel, args)
 *     → ipcMain.handle(channel)
 *       → ClasseDocumentaleIpcAdapter
 *         → Use Case
 *           → Repository
 */
import { IpcMain } from 'electron';
import { container } from 'tsyringe';
import { IpcChannels } from '../../../shared/ipc-channels';
import type { ICheckClasseDocumentaleIntegrityUC } from '../use-case/classe-documentale/ICheckClasseDocumentaleIntegrityUC';
import type { ICreateClasseDocumentaleUC } from '../use-case/classe-documentale/ICreateClasseDocumentaleUC';
import { IGetAllClasseDocumentaleUC } from '../use-case/classe-documentale/IGetAllClasseDocumentaleUC';
import { IGetClasseDocumentaleByIdUC } from '../use-case/classe-documentale/IGetClasseDocumentaleByIdUC';
import { IGetClasseDocumentaleByStatusUC } from '../use-case/classe-documentale/IGetClasseDocumentaleByStatusUC';
import { ClasseDocumentaleUC } from '../use-case/classe-documentale/tokens';
import { StatoVerificaEnum } from '../value-objects/StatoVerificaEnum';

export class ClasseDocumentaleIpcAdapter {
    static register(ipcMain: IpcMain): void {
        const getAllUC = container.resolve<IGetAllClasseDocumentaleUC>(ClasseDocumentaleUC.GET_ALL);
        const getByIdUC = container.resolve<IGetClasseDocumentaleByIdUC>(ClasseDocumentaleUC.GET_BY_ID);
        const createUC = container.resolve<ICreateClasseDocumentaleUC>(ClasseDocumentaleUC.CREATE);
        const getByStatusUC = container.resolve<IGetClasseDocumentaleByStatusUC>(ClasseDocumentaleUC.GET_BY_STATUS);
        const checkIntegrityUC = container.resolve<ICheckClasseDocumentaleIntegrityUC>(ClasseDocumentaleUC.CHECK_INTEGRITY);

        ipcMain.handle(IpcChannels.CLASSE_DOCUMENTALE_GET_ALL, () => {
            return getAllUC.execute();
        });

        ipcMain.handle(IpcChannels.CLASSE_DOCUMENTALE_GET_BY_ID, (_event, id: number) => {
            return getByIdUC.execute(id) ?? null;
        });

        ipcMain.handle(IpcChannels.CLASSE_DOCUMENTALE_CREATE, (_event, nome: string, uuid: string) => {
            return createUC.execute(nome, uuid);
        });

        ipcMain.handle(IpcChannels.CLASSE_DOCUMENTALE_GET_BY_STATUS, (_event, stato: StatoVerificaEnum) => {
            return getByStatusUC.execute(stato);
        });

        ipcMain.handle(IpcChannels.CLASSE_DOCUMENTALE_CHECK_INTEGRITY, (_event, id: number) => {
            return checkIntegrityUC.execute(id);
        });
    }
}
