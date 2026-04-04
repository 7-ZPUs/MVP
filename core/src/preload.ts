import { contextBridge, ipcRenderer } from "electron";

const validChannels = new Set([
  "package:open",
  "package:list",
  "package:close",
  "ipc:search:text",
  "ipc:search:semantic",
  "ipc:search:advanced",
  "ipc:indexing:status",
  "integrity:verify",
  "check-integrity:document",
  "check-integrity:file",
  "check-integrity:process",
  "check-integrity:document-class",
  "check-integrity:dip",
  "create:create-document",
  "create:create-process",
  "create:create-file",
  "create:create-document-class",
  "create:create-dip",
  "browse:get-document-by-id",
  "browse:get-documents-by-process",
  "browse:get-documents-by-status",
  "browse:get-file-by-id",
  "browse:get-file-buffer-by-id",
  "browse:get-file-by-document",
  "browse:get-file-by-status",
  "browse:get-process-by-id",
  "browse:get-process-by-status",
  "browse:get-process-by-document-class",
  "browse:get-document-class-by-dip-id",
  "browse:get-document-class-by-status",
  "browse:get-document-class-by-id",
  "browse:get-dip-by-id",
  "browse:get-dip-by-status",
  "browse:get-dip-by-document-class",
  "file:open-external",
  "file:download",
  "file:save-dialog",
]);

contextBridge.exposeInMainWorld("electronAPI", {
  invoke: (channel: string, data: any) => {
    if (validChannels.has(channel)) {
      return ipcRenderer.invoke(channel, data);
    }
    return Promise.reject(new Error(`Canale IPC non autorizzato: ${channel}`));
  },
});