import {
  DipIndexXml,
  DocumentClassXml,
  FileXml,
} from "../../xml-types/DipIndexXml";
import { ParsedProcess, ParsedDocument, ParsedFile } from "./IDipParser";

/**
 * Maps parsed DiPIndex XML into domain-relevant data structures.
 * The actual entity construction (with DB-assigned IDs) happens
 * in LocalPackageReaderAdapter. This class extracts the structural
 * information from the XML index.
 *
 * Hashes are not available here — they are read from the metadata XML
 * by LocalPackageReaderAdapter and populated separately.
 */
export class DipIndexMapper {
  private readonly index: DipIndexXml;

  constructor(index: DipIndexXml) {
    this.index = index;
  }

  public extractDipUuid(): string {
    return this.index.PackageInfo.ProcessUUID;
  }

  public extractDocumentClasses(): DocumentClassXml[] {
    return this.index.PackageContent.DiPDocuments.DocumentClass;
  }

  public extractProcesses(): ParsedProcess[] {
    const result: ParsedProcess[] = [];
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

  public extractDocuments(): ParsedDocument[] {
    const result: ParsedDocument[] = [];
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

  public extractFiles(): ParsedFile[] {
    const result: ParsedFile[] = [];
    for (const dc of this.extractDocumentClasses()) {
      for (const aip of dc.AiP) {
        for (const doc of aip.Document) {
          const files = doc.Files;
          const basePath = doc.DocumentPath;

          // Primary file is the main document
          result.push(
            this.mapFile(files.Primary, doc["@_uuid"], basePath, true),
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
  ): ParsedFile {
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
