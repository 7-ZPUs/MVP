import { contextBridge, ipcRenderer } from "electron";

// Expose a safe API to the renderer process
contextBridge.exposeInMainWorld("electronAPI", {
  send: (channel: string, data: any) => {
    ipcRenderer.send(channel, data);
  },
  receive: (channel: string, func: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  },
});
