export enum ImportPhase {
  IDLE    = 'idle',
  LOADING = 'loading',
  READY   = 'ready',
  EMPTY   = 'empty',  // UC-6
  ERROR   = 'error',  // UC-36
}
 
export enum StatoIndicizzazione {
  COMPLETATA     = 'completata',     // UC-11.1
  NON_COMPLETATA = 'non_completata', // UC-11.2
}
 
export enum NodeType {
  CLASSE_DOCUMENTALE = 'classe_documentale', // UC-1
  PROCESSO           = 'processo',           // UC-2
  DOCUMENTO          = 'documento',          // UC-3
}