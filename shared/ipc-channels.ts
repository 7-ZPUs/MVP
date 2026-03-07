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

  // ----- ClasseDocumentale -----
  CLASSE_DOCUMENTALE_GET_ALL: 'classe-documentale:get-all',
  CLASSE_DOCUMENTALE_GET_BY_ID: 'classe-documentale:get-by-id',
  CLASSE_DOCUMENTALE_CREATE: 'classe-documentale:create',
  CLASSE_DOCUMENTALE_GET_BY_STATUS: 'classe-documentale:get-by-status',
  CLASSE_DOCUMENTALE_CHECK_INTEGRITY: 'classe-documentale:check-integrity',
} as const;

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels];
