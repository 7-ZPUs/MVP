import { contextBridge, ipcRenderer } from "electron";

// Preload runs in a sandboxed context: importing local project modules from here
// can fail at runtime. Bootstrap the allowlist from the main process instead.
const IPC_CHANNEL_REGISTRY_CHANNEL = "__app:get-ipc-channels";

function loadAllowedChannels(): Set<string> {
  try {
    const channels = ipcRenderer.sendSync(IPC_CHANNEL_REGISTRY_CHANNEL);
    if (Array.isArray(channels)) {
      return new Set(
        channels.filter((c): c is string => typeof c === "string"),
      );
    }
  } catch (error) {
    console.error("[preload] Failed to load IPC channel registry:", error);
  }

  return new Set<string>();
}

const validChannels = loadAllowedChannels();

contextBridge.exposeInMainWorld("electronAPI", {
  invoke: (channel: string, data?: any) => {
    if (validChannels.has(channel)) {
      return ipcRenderer.invoke(channel, data);
    }
    return Promise.reject(new Error(`Canale IPC non autorizzato: ${channel}`));
  },

  // Optional debug utility for renderer diagnostics.
  listChannels: () => Array.from(validChannels),
});
