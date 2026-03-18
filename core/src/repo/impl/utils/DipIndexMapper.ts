import {
  DiPIndexXml,
  DocumentClassXml,
  FileXml,
} from "../../xml-types/DiPIndexXml";
import { Metadata } from "../../../value-objects/Metadata";

export interface MappedProcess {
  uuid: string;
  documentClassUuid: string;
  aipRoot: string;
  metadata: Metadata[];
}

export interface MappedDocument {
  uuid: string;
  processUuid: string;
  documentPath: string;
  metadataFilename: string;
}

export interface MappedFile {
  uuid: string;
  documentUuid: string;
  filename: string;
  path: string;
  isMain: boolean;
}

/**
 * Maps parsed DiPIndex XML into domain-relevant data structures.
 * The actual entity construction (with DB-assigned IDs) happens
 * in LocalPackageReaderAdapter. This class extracts the structural
 * information from the XML index.
 */
export class DipIndexMapper {
  private readonly index: DiPIndexXml;

  constructor(index: DiPIndexXml) {
    this.index = index;
  }

  public extractDipUuid(): string {
    return this.index.PackageInfo.ProcessUUID;
  }

  public extractDocumentClasses(): DocumentClassXml[] {
    return this.index.PackageContent.DiPDocuments.DocumentClass;
  }

  public extractProcesses(): MappedProcess[] {
    const result: MappedProcess[] = [];
    for (const dc of this.extractDocumentClasses()) {
      for (const aip of dc.AiP) {
        result.push({
          uuid: aip["@_uuid"],
          documentClassUuid: dc["@_uuid"],
          aipRoot: aip.AiPRoot,
          metadata: [],
        });
      }
    }
    return result;
  }

  public extractDocuments(): MappedDocument[] {
    const result: MappedDocument[] = [];
    for (const dc of this.extractDocumentClasses()) {
      for (const aip of dc.AiP) {
        for (const doc of aip.Document) {
          result.push({
            uuid: doc["@_uuid"],
            processUuid: aip["@_uuid"],
            documentPath: doc.DocumentPath,
            metadataFilename: doc.Files.Metadata["#text"],
          });
        }
      }
    }
    return result;
  }

  public extractFiles(): MappedFile[] {
    const result: MappedFile[] = [];
    for (const dc of this.extractDocumentClasses()) {
      for (const aip of dc.AiP) {
        for (const doc of aip.Document) {
          const files = doc.Files;
          const basePath = doc.DocumentPath;

          // Primary file is the main document
          result.push(
            this.mapFile(files.Primary, doc["@_uuid"], basePath, true),
            this.mapFile(files.Primary, doc["@_uuid"], basePath, false),
          );

          // Attachment files
          for (const att of files.Attachments ?? []) {
            result.push(this.mapFile(att, doc["@_uuid"], basePath, false));
          }
        }
      }
    }
    return result;
  }

  private mapFile(
    fileXml: FileXml,
    documentUuid: string,
    basePath: string,
    isMain: boolean,
  ): MappedFile {
    const filename = fileXml["#text"];
    return {
      uuid: fileXml["@_uuid"],
      documentUuid,
      filename,
      path: `${basePath}/${filename}`,
      isMain,
    };
  }
}
