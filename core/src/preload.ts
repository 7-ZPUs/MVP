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
import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  
});
