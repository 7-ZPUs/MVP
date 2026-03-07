/**
 * Preload script — eseguito nel contesto del renderer ma con accesso a Node.js.
 *
 * Espone via contextBridge un oggetto `window.electronAPI` con i metodi
 * tipizzati per ogni canale IPC. Il renderer usa SOLO questa interfaccia:
 * non ha mai accesso diretto a ipcRenderer.
 *
 * NOTA: I nomi dei canali sono inlineati (non importati da shared/) per
 * rendere il preload completamente autonomo — il require() di un modulo
 * relativo fallisce silenziosamente nel contesto preload di Electron.
 */
import { contextBridge, ipcRenderer } from 'electron';
import { StatoVerificaEnum } from './value-objects/StatoVerificaEnum';

contextBridge.exposeInMainWorld('electronAPI', {
  classeDocumentale: {
    getAll: (): Promise<unknown> =>
      ipcRenderer.invoke('classe-documentale:list'),

    getById: (id: number): Promise<unknown> =>
      ipcRenderer.invoke('classe-documentale:get', id),

    create: (nome: string): Promise<unknown> =>
      ipcRenderer.invoke('classe-documentale:create', nome),

    getByStatus: (stato: StatoVerificaEnum): Promise<unknown> =>
      ipcRenderer.invoke('classe-documentale:get-by-status', stato),
  },
});
