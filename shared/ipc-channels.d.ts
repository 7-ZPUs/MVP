/**
 * All IPC channel name constants shared between the Main and Renderer processes.
 *
 * Convention: `<domain>:<action>`
 *
 * Add a new constant here whenever a new IPC channel is introduced. Never use
 * raw string literals for channel names outside this file.
 */
export declare const IpcChannels: {
    readonly PACKAGE_OPEN: "package:open";
    readonly PACKAGE_LIST: "package:list";
    readonly PACKAGE_CLOSE: "package:close";
    readonly SEARCH_FULLTEXT: "search:fulltext";
    readonly SEARCH_SEMANTIC: "search:semantic";
    readonly INTEGRITY_VERIFY: "integrity:verify";
    readonly CREATE_DOCUMENT: "create:create-document";
    readonly CREATE_PROCESS: "create:create-process";
    readonly CREATE_FILE: "create:create-file";
    readonly CREATE_DOCUMENT_CLASS: "create:create-document-class";
    readonly CREATE_DIP: "create:create-dip";
    readonly BROWSE_GET_DOCUMENT_BY_ID: "browse:get-document-by-id";
    readonly BROWSE_GET_DOCUMENTS_BY_PROCESS: "browse:get-documents-by-process";
    readonly BROWSE_GET_DOCUMENTS_BY_STATUS: "browse:get-documents-by-status";
    readonly BROWSE_GET_FILE_BY_ID: "browse:get-file-by-id";
    readonly BROWSE_GET_FILE_BY_DOCUMENT: "browse:get-file-by-document";
    readonly BROWSE_GET_FILE_BY_STATUS: "browse:get-file-by-status";
    readonly BROWSE_GET_PROCESS_BY_ID: "browse:get-process-by-id";
    readonly BROWSE_GET_PROCESS_BY_STATUS: "browse:get-process-by-status";
    readonly BROWSE_GET_PROCESS_BY_DOCUMENT_CLASS: "browse:get-process-by-document-class";
    readonly BROWSE_GET_DOCUMENT_CLASS_BY_DIP_ID: "browse:get-document-class-by-dip-id";
    readonly BROWSE_GET_DOCUMENT_CLASS_BY_STATUS: "browse:get-document-class-by-status";
    readonly BROWSE_GET_DOCUMENT_CLASS_BY_ID: "browse:get-document-class-by-id";
    readonly BROWSE_GET_DIP_BY_ID: "browse:get-dip-by-id";
    readonly BROWSE_GET_DIP_BY_STATUS: "browse:get-dip-by-status";
    readonly BROWSE_GET_DIP_BY_DOCUMENT_CLASS: "browse:get-dip-by-document-class";
};
export type IpcChannel = (typeof IpcChannels)[keyof typeof IpcChannels];
//# sourceMappingURL=ipc-channels.d.ts.map