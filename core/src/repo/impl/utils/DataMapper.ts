import { DocumentClass } from "../../../entity/DocumentClass";
import { Process } from "../../../entity/Process";
import { Document } from "../../../entity/Document";
import { File } from "../../../entity/File";
import { Dip } from "../../../entity/Dip";
import { Metadata, MetadataType } from "../../../value-objects/Metadata";
import { DocumentMetadataHashMapper } from "./DocumentMetadataHashMapper";
import { IDataMapper, MapperRequest } from "./IDataMapper";
import path from "node:path";
import { container } from "../../../container";

export class DataMapper implements IDataMapper {
  private readonly hashMapper = new DocumentMetadataHashMapper();
  private rawDipIndex: any;

  public mapDip(): Dip {
    if (!this.rawDipIndex?.DiPIndex?.PackageContent?.DiPDocuments?.DocumentClass) {
      throw new Error("Missing DocumentClass fragments");
    }
    return new Dip(this.rawDipIndex?.DiPIndex?.PackageInfo?.ProcessUUID || "");
  }

  public mapDocumentClasses(): DocumentClass[] {
    const classes = this.extractDocumentClassFragments();
    const dipUuid = this.rawDipIndex?.DiPIndex?.PackageInfo?.ProcessUUID || "";
    return classes.map((c) => {
      // Support both xml2js ($) and legacy (@_uuid/@_name) attribute formats
      const uuid = c.$?.uuid ?? c["@_uuid"] ?? "";
      const name = c.$?.name ?? c["@_name"] ?? "";
      const validFrom = c.$?.validFrom ?? c["@_validFrom"] ?? undefined;
      return new DocumentClass(dipUuid, uuid, name, validFrom);
    });
  }

  public getProcessMappers(): MapperRequest<Process>[] {
    const fragments = this.extractProcessFragments();
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

  public getDocumentMappers(): MapperRequest<Document>[] {
    const fragments = this.extractDocumentFragments();
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

  public getFileMappers(): MapperRequest<File>[] {
    const docFragments = this.extractDocumentFragments();
    const fileFragments = this.extractFileFragments().filter(
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
            path.join(container.resolve("DIP_PATH_TOKEN"), physicalPath),
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

  private extractDocumentClassFragments(): any[] {
    const classes =
      this.rawDipIndex?.DiPIndex?.PackageContent?.DiPDocuments?.DocumentClass;
    if (!classes) return [];
    return Array.isArray(classes) ? classes : [classes];
  }

  private extractProcessFragments(): any[] {
    const classes = this.extractDocumentClassFragments();
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

  private extractDocumentFragments(): any[] {
    const processes = this.extractProcessFragments();
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

  private extractFileFragments(): any[] {
    const documents = this.extractDocumentFragments();
    const primaryFragments = documents
      .map((doc) => this.extractPrimaryFileFragment(doc))
      .filter((fragment): fragment is Record<string, unknown> =>
        Boolean(fragment),
      );
    const attachmentFragments = documents.flatMap((doc) =>
      this.extractAttachmentFileFragments(doc),
    );
    return [...primaryFragments, ...attachmentFragments];
  }

  private extractPrimaryFileFragment(doc: any): Record<string, unknown> | null {
    const primary = doc.Files?.Primary;
    if (!primary) return null;
    return this.createFileFragment(doc, primary, true);
  }

  private extractAttachmentFileFragments(doc: any): Record<string, unknown>[] {
    const attachments = doc.Files?.Attachments;
    if (!attachments) return [];

    const entries = Array.isArray(attachments) ? attachments : [attachments];
    return entries
      .map((attachment) => this.createFileFragment(doc, attachment, false))
      .filter((fragment): fragment is Record<string, unknown> =>
        Boolean(fragment),
      );
  }

  private createFileFragment(
    doc: any,
    fileNode: any,
    isMain: boolean,
  ): Record<string, unknown> | null {
    if (this.shouldIgnoreFilePath(this.extractNodeText(fileNode))) {
      return null;
    }

    const fileContext = this.extractFileContextFromDocument(doc);
    return {
      ...fileNode,
      ...fileContext,
      isMain,
    };
  }

  private extractFileContextFromDocument(doc: any): {
    _documentUuid: string;
    _basePath: string;
    _aipRoot: string;
  } {
    // Support both xml2js ($) and legacy (@_uuid) attribute formats
    const documentUuid = doc.$?.uuid ?? doc["@_uuid"] ?? "";
    const basePath = doc.DocumentPath ?? doc.$?.DocumentPath ?? "";
    const aipRoot = doc._aipRoot ?? doc.$?._aipRoot ?? "";
    return {
      _documentUuid: documentUuid,
      _basePath: basePath,
      _aipRoot: aipRoot,
    };
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
    const customMeta = rawMetadataFragment?.Document?.[0]["CustomMetadata"];
    if (customMeta) {
      const customChildren = this.extractMetadataDict(customMeta, false);
      children.push(
        new Metadata(
          "CustomMetadata",
          customChildren.filter((c) => !c.getName().startsWith("@")),
          MetadataType.COMPOSITE,
        ),
      );
    }
    return new Metadata(rootTag, children, MetadataType.COMPOSITE);
  }

  private extractProcessMetadata(rawMetadataFragment: any): Metadata {
    const root = rawMetadataFragment?.AiPInfo ?? rawMetadataFragment;
    if (!root) return new Metadata("Unknown", [], MetadataType.COMPOSITE);
    const children = this.extractMetadataDict(root, false);
    return new Metadata("AiPInfo", children, MetadataType.COMPOSITE);
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

  public setRawDipIndex(rawDipIndex: any): void {
    this.rawDipIndex = rawDipIndex;
  }
}
