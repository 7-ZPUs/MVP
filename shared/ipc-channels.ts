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
  PACKAGE_OPEN: 'package:open',
  PACKAGE_LIST: 'package:list',
  PACKAGE_CLOSE: 'package:close',

  // ----- Search -----
  SEARCH_FULLTEXT: 'search:fulltext',
  SEARCH_SEMANTIC: 'search:semantic',

  // ----- Integrity -----
  INTEGRITY_VERIFY: 'integrity:verify',

  // ----- Browse: Documento -----
  BROWSE_GET_DOCUMENT_BY_ID: 'browse:get-document-by-id',
  BROWSE_GET_DOCUMENTS_BY_PROCESS: 'browse:get-documents-by-process',
  BROWSE_GET_DOCUMENTS_BY_STATUS: 'browse:get-documents-by-status',

  // ----- Browse: File -----
  BROWSE_GET_FILE_BY_ID: 'browse:get-file-by-id',
  BROWSE_GET_FILES_BY_DOCUMENT: 'browse:get-files-by-document',
  BROWSE_GET_FILES_BY_STATUS: 'browse:get-files-by-status',
} as const;

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels];
