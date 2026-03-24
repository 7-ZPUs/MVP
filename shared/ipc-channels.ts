/**
 * All IPC channel name constants shared between the Main and Renderer processes.
 *
 * Convention: `<domain>:<action>`
 *
 * Add a new constant here whenever a new IPC channel is introduced. Never use
 * raw string literals for channel names outside this file.
 */
export const IpcChannels = {
  // ----- Package management -----
  PACKAGE_OPEN: "package:open",
  PACKAGE_LIST: "package:list",
  PACKAGE_CLOSE: "package:close",

  // ----- Search -----
  SEARCH_FULLTEXT: "search:fulltext",
  SEARCH_SEMANTIC: "search:semantic",

  // ----- Integrity -----
  INTEGRITY_VERIFY: "integrity:verify",

  CREATE_DOCUMENT: "create:create-document",
  CREATE_PROCESS: "create:create-process",
  CREATE_FILE: "create:create-file",
  CREATE_DOCUMENT_CLASS: "create:create-document-class",
  CREATE_DIP: "create:create-dip",

  // ----- Browse: Documento -----
  BROWSE_GET_DOCUMENT_BY_ID: "browse:get-document-by-id",
  BROWSE_GET_DOCUMENTS_BY_PROCESS: "browse:get-documents-by-process",
  BROWSE_GET_DOCUMENTS_BY_STATUS: "browse:get-documents-by-status",

  // ----- Browse: File -----
  BROWSE_GET_FILE_BY_ID: "browse:get-file-by-id",
  BROWSE_GET_FILE_BY_DOCUMENT: "browse:get-file-by-document",
  BROWSE_GET_FILE_BY_STATUS: "browse:get-file-by-status",

  // ----- Browse: Process -----
  BROWSE_GET_PROCESS_BY_ID: "browse:get-process-by-id",
  BROWSE_GET_PROCESS_BY_STATUS: "browse:get-process-by-status",
  BROWSE_GET_PROCESS_BY_DOCUMENT_CLASS: "browse:get-process-by-document-class",

  // ----- Browse: DocumentClass -----
  BROWSE_GET_DOCUMENT_CLASS_BY_DIP_ID: "browse:get-document-class-by-dip-id",
  BROWSE_GET_DOCUMENT_CLASS_BY_STATUS: "browse:get-document-class-by-status",
  BROWSE_GET_DOCUMENT_CLASS_BY_ID: "browse:get-document-class-by-id",

  // ----- Browse: Dip -----
  BROWSE_GET_DIP_BY_ID: "browse:get-dip-by-id",
  BROWSE_GET_DIP_BY_STATUS: "browse:get-dip-by-status",
  BROWSE_GET_DIP_BY_DOCUMENT_CLASS: "browse:get-dip-by-document-class",
} as const;

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels];
