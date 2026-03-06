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
  CLASSE_DOCUMENTALE_LIST: 'classe-documentale:list',
  CLASSE_DOCUMENTALE_GET: 'classe-documentale:get',
  CLASSE_DOCUMENTALE_CREATE: 'classe-documentale:create',
} as const;

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels];
