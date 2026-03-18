/**
 * TypeScript interfaces mapping the DiPIndex.xsd schema.
 * These represent the raw XML structure as parsed by fast-xml-parser.
 */

export interface DipIndexXml {
  ComplianceStatement: ComplianceStatementXml | ComplianceStatementXml[];
  PackageInfo: PackageInfoXml;
  PackageContent: PackageContentXml;
}

export interface ComplianceStatementXml {
  Title: string;
  Body: string;
  "@_lang"?: string;
}

export interface PackageInfoXml {
  CreatingApplication: CreatingApplicationXml;
  ProcessUUID: string;
  CreationDate: string;
  DocumentsCount: number;
  AiPCount: number;
}

export interface CreatingApplicationXml {
  Name: string;
  Version: string;
  Producer: string;
}

export interface PackageContentXml {
  DiPDocuments: DiPDocumentsXml;
  RepresentationInformation?: RepresentationInformationXml[];
}

export interface DiPDocumentsXml {
  Statement: StatementXml[];
  DocumentClass: DocumentClassXml[];
}

export interface StatementXml {
  "#text": string;
  "@_lang"?: string;
}

export interface DocumentClassXml {
  RappresentationInformationUUID?: string[];
  AiP: AiPXml[];
  MoreData?: MoreDataXml[];
  "@_uuid": string;
  "@_name": string;
  "@_version": string;
  "@_validFrom": string;
  "@_validTo"?: string;
}

export interface AiPXml {
  AiPRoot: string;
  Report?: ReportXml | ReportXml[];
  SiP?: SiPXml | SiPXml[];
  Document: DocumentXml[];
  "@_uuid": string;
}

export interface ReportXml {
  "#text": string;
  "@_uuid": string;
  "@_name": string;
}

export interface SiPXml {
  "#text": string;
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
  "@_FilesCount": number;
}

export interface FileXml {
  "#text": string;
  "@_uuid": string;
}

export interface RepresentationInformationXml {
  Name: string;
  Description: string;
  MimeType: string;
  Content: FileXml[];
  "@_uuid": string;
}

export interface MoreDataXml {
  "#text": string;
  "@_name": string;
}
