/*
export interface ExportResponseDto {
  success:       boolean;
  destPath?:     string;
  errorCode?:    string;
  errorMessage?: string;
}
 
/** Risposta IPC per generazione PDF report 
export interface ExportPdfResponseDto {
  success:       boolean;
  blob?:         Blob;
  errorCode?:    string;
  errorMessage?: string;
}*/
 
/** Risposta IPC per dialog salvataggio */
export interface SaveDialogResponseDto {
  canceled: boolean;
  filePath?: string;
}

export interface FileDTO {
    id:              number;
    documentId:      number;
    filename:        string;
    path:            string;
    hash:            string;
    integrityStatus: string;
    isMain:          boolean;
}