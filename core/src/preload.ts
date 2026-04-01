import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  invoke: (channel: string, data: any) => {
    const validChannels = [
      "ipc:search:text",
      "ipc:search:semantic",
      "ipc:search:advanced",
      "ipc:indexing:status",
    ];

    if (validChannels.includes(channel)) {
      return ipcRenderer.invoke(channel, data);
    } else {
      return Promise.reject(
        new Error(`Canale IPC non autorizzato: ${channel}`),
      );
    }
  },
});