// renderer/src/app/shared/domain/document-detail.model.ts

export interface DocumentDetailDTO {
  id: string;
  titolo: string;
  formato: string; // es. 'application/pdf'
  fileData?: any; // Qui metteremo il Uint8Array, Blob o Base64 in futuro
  metadata: any; // Metadati generici mockati
}
