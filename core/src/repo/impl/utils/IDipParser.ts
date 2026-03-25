import { Metadata } from "../../../value-objects/Metadata";

export const DIP_PARSER_TOKEN = Symbol("IDiPIndexParser");

export interface ParsedDocumentClass {
  uuid: string;
  name: string;
  timestamp?: string;
}

export interface ParsedProcess {
  uuid: string;
  documentClassUuid: string;
  aipRoot: string;
  metadata: Metadata[];
}

export interface ParsedDocument {
  uuid: string;
  processUuid: string;
  documentPath: string;
  metadataFilename: string;
}

export interface ParsedFile {
  uuid: string;
  documentUuid: string;
  filename: string;
  path: string;
  isMain: boolean;
}

export interface ParsedDipIndex {
  dipUuid: string;
  documentClasses: ParsedDocumentClass[];
  processes: ParsedProcess[];
  documents: ParsedDocument[];
  files: ParsedFile[];
}

/**
 * Internal abstraction for parsing the DiPIndex file.
 * Not a hexagonal port — this is an implementation detail of
 * LocalPackageReaderAdapter that allows swapping the format
 * (e.g. XML, JSON) without changing the adapter or the domain.
 */
export interface IDipParser {
  parseDipIndex(rawContent: string): ParsedDipIndex;
  parseDocumentMetadata(rawContent: string): Metadata[];
  parseProcessMetadata(rawContent: string): Metadata[];
}
