import { IpcMain } from 'electron';
import { container } from 'tsyringe';

import { IpcChannels } from '../../../shared/ipc-channels';
import { SearchFilter } from '../value-objects/SearchFilter';

import type { ISearchDocumentalClassUC } from '../use-case/classe-documentale/ISearchDocumentalClassUC';
import type { ISearchProcessUC }        from '../use-case/process/ISearchProcessUC';
import type { ISearchDocumentsUC }       from '../use-case/document/ISearchDocumentsUC';

import { DocumentClassUC } from '../use-case/classe-documentale/tokens';
import { ProcessUC }       from '../use-case/process/token';
import { DocumentoUC }     from '../use-case/document/tokens';

export class SearchIpcAdapter {
    static register(ipcMain: IpcMain): void {
        const searchClassesUC   = container.resolve<ISearchDocumentalClassUC>(DocumentClassUC.SEARCH_BY_DOCUMENTAL_CLASS_NAME);
        const searchProcessiUC  = container.resolve<ISearchProcessUC>(ProcessUC.SEARCH_BY_PROCESS_UUID);
        const searchDocumentsUC = container.resolve<ISearchDocumentsUC>(DocumentoUC.SEARCH_BY_FILTERS);

        ipcMain.handle(IpcChannels.SEARCH_CLASSES, (_event, name?: string) => {
            return searchClassesUC.execute(name ?? '').map((dc) => dc.toDTO());
        });

        ipcMain.handle(IpcChannels.SEARCH_PROCESSES, (_event, uuid?: string) => {
            return searchProcessiUC.execute(uuid ?? '').map((p) => p.toDTO());
        });

        ipcMain.handle(IpcChannels.SEARCH_DOCUMENTS, (_event, rawFilters: SearchFilter[]) => {
            const filters = rawFilters.map((f) => new SearchFilter(f.field, f.value));
            return searchDocumentsUC.execute(filters).map((d) => d.toDTO());
        });
    }
}