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

  // ----- Persona (CRUD example) -----
  PERSONA_LIST: 'persona:list',
  PERSONA_GET: 'persona:get',
  PERSONA_CREATE: 'persona:create',
  PERSONA_UPDATE: 'persona:update',
  PERSONA_DELETE: 'persona:delete',
} as const;

export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels];
