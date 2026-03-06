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
import { ClasseDocumentaleUC } from '../use-case/classe-documentale/tokens';
import type { IFindAllClasseDocumentaleUC } from '../use-case/classe-documentale/IFindAllClasseDocumentaleUC';
import type { IFindByIdClasseDocumentaleUC } from '../use-case/classe-documentale/IFindByIdClasseDocumentaleUC';
import type { ICreateClasseDocumentaleUC } from '../use-case/classe-documentale/ICreateClasseDocumentaleUC';
import { IpcChannels } from '../../../shared/ipc-channels';

export class ClasseDocumentaleIpcAdapter {
    static register(ipcMain: IpcMain): void {
        const findAllUC = container.resolve<IFindAllClasseDocumentaleUC>(ClasseDocumentaleUC.FIND_ALL);
        const findByIdUC = container.resolve<IFindByIdClasseDocumentaleUC>(ClasseDocumentaleUC.FIND_BY_ID);
        const createUC = container.resolve<ICreateClasseDocumentaleUC>(ClasseDocumentaleUC.CREATE);

        ipcMain.handle(IpcChannels.CLASSE_DOCUMENTALE_LIST, () => {
            return findAllUC.execute();
        });

        ipcMain.handle(IpcChannels.CLASSE_DOCUMENTALE_GET, (_event, id: number) => {
            return findByIdUC.execute(id) ?? null;
        });

        ipcMain.handle(IpcChannels.CLASSE_DOCUMENTALE_CREATE, (_event, nome: string) => {
            return createUC.execute(nome);
        });
    }
}
