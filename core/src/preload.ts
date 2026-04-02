import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  invoke: (channel: string, data: any) => {
    // Allows searching channels, browse channels, and file channels.
    const isValid =
      channel.startsWith("ipc:search:") ||
      channel.startsWith("browse:") ||
      channel.startsWith("file:") ||
      channel.startsWith("check-integrity:") ||
      channel === "ipc:indexing:status";

    if (isValid) {
      return ipcRenderer.invoke(channel, data);
    } else {
      return Promise.reject(
        new Error(`Canale IPC non autorizzato: ${channel}`),
      );
    }
  },
});
