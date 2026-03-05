/**
 * PersonaIpcAdapter — Inbound Adapter (IPC)
 *
 * Registra su ipcMain i channel per il CRUD di Persona.
 * Non contiene NESSUNA business logic: delega tutto al use-case IPersonaUseCase.
 *
 * Ogni handler usa ipcMain.handle (pattern request/response con invoke lato renderer).
 *
 * Flusso:
 *   Renderer ipcRenderer.invoke(channel, args)
 *     → ipcMain.handle(channel)
 *       → PersonaIpcAdapter
 *         → IPersonaUseCase (PersonaService)
 *           → IPersonaRepository (PersonaSqliteRepository)
 */
import { IpcMain } from 'electron';
import { container } from 'tsyringe';
import { PERSONA_USE_CASE_TOKEN } from '../../../domain/ports/inbound/IPersonaUseCase';
import type { IPersonaUseCase } from '../../../domain/ports/inbound/IPersonaUseCase';
import { IpcChannels } from '../../../../../shared/ipc-channels';

export class PersonaIpcAdapter {
    static register(ipcMain: IpcMain): void {
        const useCase = container.resolve<IPersonaUseCase>(PERSONA_USE_CASE_TOKEN);

        // GET  persona:list → Persona[]
        ipcMain.handle(IpcChannels.PERSONA_LIST, () => {
            return useCase.listAll();
        });

        // GET  persona:get  → Persona | undefined
        // args: [id: number]
        ipcMain.handle(IpcChannels.PERSONA_GET, (_event, id: number) => {
            return useCase.getById(id) ?? null;
        });

        // POST persona:create → Persona
        // args: [nome: string, cognome: string]
        ipcMain.handle(IpcChannels.PERSONA_CREATE, (_event, nome: string, cognome: string) => {
            return useCase.create(nome, cognome);
        });

        // PUT  persona:update → Persona | null
        // args: [id: number, nome: string, cognome: string]
        ipcMain.handle(IpcChannels.PERSONA_UPDATE, (_event, id: number, nome: string, cognome: string) => {
            return useCase.update(id, nome, cognome) ?? null;
        });

        // DELETE persona:delete → boolean
        // args: [id: number]
        ipcMain.handle(IpcChannels.PERSONA_DELETE, (_event, id: number) => {
            return useCase.delete(id);
        });
    }
}
