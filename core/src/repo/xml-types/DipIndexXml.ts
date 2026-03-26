/**
 * TypeScript interfaces mapping the DiPIndex.xsd schema.
 * These represent the raw XML structure as parsed by fast-xml-parser.
 */

export interface DipIndexXml {
  PackageInfo: { ProcessUUID: string };
  PackageContent: PackageContentXml;
}

export interface PackageContentXml {
  DiPDocuments: DiPDocumentsXml;
}

export interface DiPDocumentsXml {
  DocumentClass: DocumentClassXml[];
}

export interface DocumentClassXml {
  AiP: AiPXml[];
  "@_uuid": string;
  "@_name": string;
  "@_validFrom"?: string;
}

export interface AiPXml {
  AiPRoot: string;
  Document: DocumentXml[];
  "@_uuid": string;
}

export interface DocumentXml {
  DocumentPath: string;
  Files: DocumentFilesXml;
  "@_uuid": string;
}

export interface DocumentFilesXml {
  Primary: FileXml;
  Metadata: FileXml;
  Attachments?: FileXml[];
}

export interface FileXml {
  "#text": string;
  "@_uuid": string;
}
