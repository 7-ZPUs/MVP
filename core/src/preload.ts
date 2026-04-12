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

type RendererEventHandler = (...args: unknown[]) => void;

function ensureAllowedChannel(channel: string): void {
  if (!validChannels.has(channel)) {
    throw new Error(`Canale IPC non autorizzato: ${channel}`);
  }
}

function subscribe(channel: string, handler: RendererEventHandler): () => void {
  ensureAllowedChannel(channel);

  const wrapped = (_event: unknown, ...args: unknown[]) => handler(...args);
  ipcRenderer.on(channel, wrapped);

  return () => {
    ipcRenderer.removeListener(channel, wrapped);
  };
}

const bridge = {
  invoke: (channel: string, data?: any) => {
    ensureAllowedChannel(channel);
    return ipcRenderer.invoke(channel, data);
  },

  on: (channel: string, handler: RendererEventHandler) => {
    return subscribe(channel, handler);
  },

  receive: (channel: string, handler: RendererEventHandler) => {
    return subscribe(channel, handler);
  },

  // Optional debug utility for renderer diagnostics.
  listChannels: () => Array.from(validChannels),
};

contextBridge.exposeInMainWorld("electronAPI", bridge);
contextBridge.exposeInMainWorld("electron", bridge);
contextBridge.exposeInMainWorld("api", bridge);
