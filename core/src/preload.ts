import { contextBridge, ipcRenderer } from "electron";
import { IpcChannels } from "../../shared/ipc-channels";

contextBridge.exposeInMainWorld("electronAPI", {
  invoke: (channel: string, data?: any) => {
    // Estraiamo dinamicamente tutti i canali validi dal nostro file condiviso
    const validChannels = Object.values(IpcChannels) as string[];

    const isValid = validChannels.includes(channel);

    if (isValid) {
      return ipcRenderer.invoke(channel, data);
    } else {
      return Promise.reject(
        new Error(`Canale IPC non autorizzato: ${channel}`),
      );
    }
  },
});
