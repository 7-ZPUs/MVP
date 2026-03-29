import { DocumentClass } from "../../../entity/DocumentClass";
import { Process } from "../../../entity/Process";
import { Document } from "../../../entity/Document";
import { File } from "../../../entity/File";
import { Dip } from "../../../entity/Dip";
import { Metadata, MetadataType } from "../../../value-objects/Metadata";
import { DocumentMetadataHashMapper } from "./DocumentMetadataHashMapper";
import { IDataMapper, MapperRequest } from "./IDataMapper";

export class DataMapper implements IDataMapper {
  private readonly hashMapper = new DocumentMetadataHashMapper();

  public mapDip(rawDipIndex: any): Dip {
    if (!rawDipIndex?.DiPIndex?.PackageContent?.DiPDocuments?.DocumentClass) {
      throw new Error("Missing DocumentClass fragments");
    }
    return new Dip(rawDipIndex?.DiPIndex?.PackageInfo?.ProcessUUID || "");
  }

  public mapDocumentClasses(rawDipIndex: any): DocumentClass[] {
    const classes = this.extractDocumentClassFragments(rawDipIndex);
    const dipUuid = rawDipIndex?.DiPIndex?.PackageInfo?.ProcessUUID || "";
    return classes.map((c) => {
      // Support both xml2js ($) and legacy (@_uuid/@_name) attribute formats
      const uuid = c.$?.uuid ?? c["@_uuid"] ?? "";
      const name = c.$?.name ?? c["@_name"] ?? "";
      const validFrom = c.$?.validFrom ?? c["@_validFrom"] ?? undefined;
      return new DocumentClass(dipUuid, uuid, name, validFrom);
    });
  }

  public getProcessMappers(rawDipIndex: any): MapperRequest<Process>[] {
    const fragments = this.extractProcessFragments(rawDipIndex);
    return fragments.map((proc) => {
      // Support both xml2js ($) and legacy (@_uuid) attribute formats
      const uuid = proc.$?.uuid ?? proc["@_uuid"] ?? "";
      const documentClassUuid =
        proc._documentClassUuid ?? proc.$?._documentClassUuid ?? "";
      const aipRoot = proc.AiPRoot ?? proc.$?.AiPRoot ?? "";
      return {
        metadataRelativePath: `${aipRoot}/AiPInfo.${uuid}.xml`,
        map: (rawMetadataFragment: any) => {
          const metadata = this.extractProcessMetadata(rawMetadataFragment);
          return new Process(documentClassUuid, uuid, metadata);
        },
      };
    });
  }

  public getDocumentMappers(rawDipIndex: any): MapperRequest<Document>[] {
    const fragments = this.extractDocumentFragments(rawDipIndex);
    return fragments.map((doc) => {
      // Support both xml2js ($) and legacy (@_uuid) attribute formats
      const uuid = doc.$?.uuid ?? doc["@_uuid"] ?? "";
      const processUuid = doc._processUuid ?? doc.$?._processUuid ?? "";
      const pathInfo = this.extractDocumentMetadataPath(doc);
      return {
        metadataRelativePath: pathInfo.path
          ? this.resolveRelativePath(pathInfo)
          : null,
        map: (rawMetadataFragment: any) => {
          const metadata = this.extractDocumentMetadata(rawMetadataFragment);
          return new Document(uuid, metadata, processUuid);
        },
      };
    });
  }

  public getFileMappers(rawDipIndex: any): MapperRequest<File>[] {
    const docFragments = this.extractDocumentFragments(rawDipIndex);
    const fileFragments = this.extractFileFragments(rawDipIndex).filter(
      (file) => !this.shouldIgnoreFilePath(this.extractNodeText(file)),
    );

    return fileFragments.map((file) => {
      // Support both xml2js ($) and legacy (@_uuid) attribute formats
      const uuid = file.$?.uuid ?? file["@_uuid"] ?? "";
      const documentUuid = file._documentUuid ?? file.$?._documentUuid ?? "";
      const basePath = file._basePath ?? file.$?._basePath ?? "";
      const aipRoot = file._aipRoot ?? file.$?._aipRoot ?? "";
      const isMain = file.isMain ?? file.$?.isMain ?? false;
      const text = this.extractNodeText(file) || file.$?.text || "";
      const doc = docFragments.find(
        (d) => (d.$?.uuid ?? d["@_uuid"]) === documentUuid,
      );
      const pathInfo = doc ? this.extractDocumentMetadataPath(doc) : null;
      const metadataRelativePath = pathInfo?.path
        ? this.resolveRelativePath(pathInfo)
        : null;

      return {
        metadataRelativePath,
        map: (rawMetadataFragment: any) => {
          let extractedMetadata: Metadata[] = [];
          if (rawMetadataFragment) {
            const docMetadata =
              this.extractDocumentMetadata(rawMetadataFragment);
            extractedMetadata = [docMetadata];
          }
          const extractedHashes = this.hashMapper.map(
            extractedMetadata,
            documentUuid,
          );
          const hash = extractedHashes.get(uuid);
          const physicalPath = this.resolveRelativePath({
            path: `${basePath}/${text}`,
            aipRoot,
          });

          return new File(
            text,
            physicalPath,
            hash ?? "",
            isMain,
            uuid,
            documentUuid,
          );
        },
      };
    });
  }

  private resolveRelativePath(extractedPath: {
    path: string;
    aipRoot: string;
  }): string {
    const normalizedOriginalPath = extractedPath.path.replaceAll("/./", "/");
    if (
      extractedPath.aipRoot &&
      normalizedOriginalPath.startsWith(extractedPath.aipRoot)
    ) {
      return normalizedOriginalPath;
    }
    const normalizedPath = normalizedOriginalPath.replace(/^\.\//, "");
    return `${extractedPath.aipRoot ? extractedPath.aipRoot + "/" : ""}${normalizedPath}`;
  }

  private extractNodeText(node: any): string {
    if (!node) return "";
    if (typeof node === "string") return node;
    return node["#text"] ?? node._ ?? "";
  }

  private shouldIgnoreFilePath(path: string): boolean {
    return path.toLowerCase().endsWith(".metadata.xml");
  }

  private extractDocumentClassFragments(rawDipIndex: any): any[] {
    const classes =
      rawDipIndex?.DiPIndex?.PackageContent?.DiPDocuments?.DocumentClass;
    if (!classes) return [];
    return Array.isArray(classes) ? classes : [classes];
  }

  private extractProcessFragments(rawDipIndex: any): any[] {
    const classes = this.extractDocumentClassFragments(rawDipIndex);
    const fragments: any[] = [];
    for (const dc of classes) {
      // Support both xml2js ($) and legacy (@_uuid) attribute formats
      const documentClassUuid = dc.$?.uuid ?? dc["@_uuid"] ?? "";
      if (dc.AiP) {
        const aips = Array.isArray(dc.AiP) ? dc.AiP : [dc.AiP];
        for (const aip of aips) {
          fragments.push({
            ...aip,
            _documentClassUuid: documentClassUuid,
          });
        }
      }
    }
    return fragments;
  }

  private extractDocumentFragments(rawDipIndex: any): any[] {
    const processes = this.extractProcessFragments(rawDipIndex);
    const fragments: any[] = [];
    for (const p of processes) {
      // Support both xml2js ($) and legacy (@_uuid) attribute formats
      const processUuid = p.$?.uuid ?? p["@_uuid"] ?? "";
      const aipRoot = p.AiPRoot ?? p.$?.AiPRoot ?? "";
      if (p.Document) {
        const docs = Array.isArray(p.Document) ? p.Document : [p.Document];
        for (const doc of docs) {
          fragments.push({
            ...doc,
            _processUuid: processUuid,
            _aipRoot: aipRoot,
          });
        }
      }
    }
    return fragments;
  }

  private extractDocumentMetadataPath(rawDocumentFragment: any): {
    path: string;
    aipRoot: string;
    processUuid: string;
  } {
    const documentPath =
      rawDocumentFragment.DocumentPath ??
      rawDocumentFragment.$?.DocumentPath ??
      "";
    const metadataPath = this.extractNodeText(
      rawDocumentFragment.Files?.Metadata,
    );
    return {
      path: metadataPath ? `${documentPath}/${metadataPath}` : "",
      aipRoot: rawDocumentFragment._aipRoot || "",
      processUuid: rawDocumentFragment._processUuid || "",
    };
  }

  private extractFileFragments(rawDipIndex: any): any[] {
    const documents = this.extractDocumentFragments(rawDipIndex);
    const primaryFragments: any[] = [];
    const attachmentFragments: any[] = [];
    for (const doc of documents) {
      // Support both xml2js ($) and legacy (@_uuid) attribute formats
      const documentUuid = doc.$?.uuid ?? doc["@_uuid"] ?? "";
      const basePath = doc.DocumentPath ?? doc.$?.DocumentPath ?? "";
      const aipRoot = doc._aipRoot ?? doc.$?._aipRoot ?? "";
      const files = doc.Files;
      if (files?.Primary) {
        const primaryText = this.extractNodeText(files.Primary);
        if (!this.shouldIgnoreFilePath(primaryText)) {
          primaryFragments.push({
            ...files.Primary,
            _documentUuid: documentUuid,
            _basePath: basePath,
            _aipRoot: aipRoot,
            isMain: true,
          });
        }
      }
      if (files?.Attachments) {
        const atts = Array.isArray(files.Attachments)
          ? files.Attachments
          : [files.Attachments];
        for (const att of atts) {
          const attText = this.extractNodeText(att);
          if (this.shouldIgnoreFilePath(attText)) {
            continue;
          }
          attachmentFragments.push({
            ...att,
            _documentUuid: documentUuid,
            _basePath: basePath,
            _aipRoot: aipRoot,
            isMain: false,
          });
        }
      }
    }
    return [...primaryFragments, ...attachmentFragments];
  }

  private extractDocumentMetadata(rawMetadataFragment: any): Metadata {
    if (!rawMetadataFragment?.Document?.[0]) {
      return new Metadata("Unknown", [], MetadataType.COMPOSITE);
    }
    const documentNode = rawMetadataFragment.Document[0];

    const rootCandidates = [
      "DocumentoAmministrativoInformatico",
      "DocumentoInformatico",
      "AggregazioneDocumentaliInformatiche",
    ] as const;

    const rootTag = rootCandidates.find((candidate) => documentNode[candidate]);
    if (!rootTag) {
      return new Metadata("Unknown", [], MetadataType.COMPOSITE);
    }

    const rootNode = documentNode[rootTag];
    const children = this.extractMetadataDict(rootNode, true);
    return new Metadata(rootTag, children, MetadataType.COMPOSITE);
  }

  private extractProcessMetadata(rawMetadataFragment: any): Metadata[] {
    const root = rawMetadataFragment?.AiPInfo ?? rawMetadataFragment;
    if (!root) return [];
    return this.extractMetadataDict(root, false);
  }

  private extractMetadataDict(obj: any, filterUuid: boolean): Metadata[] {
    return Object.entries(obj).flatMap(([key, value]) => {
      if (filterUuid && key === "@_uuid") return [];
      if (value === null || value === undefined) return [];

      if (Array.isArray(value)) {
        const nestedList = value.flatMap((item) => {
          if (typeof item === "object" && item !== null) {
            const nested = this.extractMetadataDict(item, filterUuid);
            if (filterUuid && nested.length === 0) return [];
            return filterUuid
              ? [new Metadata(key, nested, MetadataType.COMPOSITE)]
              : nested;
          }
          return [new Metadata(key, String(item), this.getMetadataType(item))];
        });
        return filterUuid
          ? nestedList
          : [new Metadata(key, nestedList, MetadataType.COMPOSITE)];
      }

      if (typeof value === "object" && value !== null) {
        const nested = this.extractMetadataDict(value, filterUuid);
        if (nested.length > 0) {
          return [new Metadata(key, nested, MetadataType.COMPOSITE)];
        }
        return [];
      }

      return [new Metadata(key, String(value), this.getMetadataType(value))];
    });
  }

  private getMetadataType(value: any): MetadataType {
    if (typeof value === "number") return MetadataType.NUMBER;
    if (typeof value === "boolean") return MetadataType.BOOLEAN;
    return MetadataType.STRING;
  }
}
