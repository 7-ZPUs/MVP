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
    return classes.map(c => new DocumentClass(
      dipUuid,
      c["@_uuid"],
      c["@_name"],
      c["@_validFrom"]
    ));
  }

  public getProcessMappers(rawDipIndex: any): MapperRequest<Process>[] {
    const fragments = this.extractProcessFragments(rawDipIndex);
    return fragments.map(proc => ({
      metadataRelativePath: `${proc.AiPRoot}/AiPInfo.${proc["@_uuid"]}.xml`,
      map: (rawMetadataFragment: any) => {
        const metadata = this.extractProcessMetadata(rawMetadataFragment);
        return new Process(
          proc._documentClassUuid,
          proc["@_uuid"],
          metadata
        );
      }
    }));
  }

  public getDocumentMappers(rawDipIndex: any): MapperRequest<Document>[] {
    const fragments = this.extractDocumentFragments(rawDipIndex);
    return fragments.map(doc => {
      const pathInfo = this.extractDocumentMetadataPath(doc);
      return {
        metadataRelativePath: pathInfo.path ? this.resolveRelativePath(pathInfo) : null,
        map: (rawMetadataFragment: any) => {
          const metadata = this.extractDocumentMetadata(rawMetadataFragment);
          return new Document(
            doc["@_uuid"],
            metadata,
            doc._processUuid
          );
        }
      };
    });
  }

  public getFileMappers(rawDipIndex: any): MapperRequest<File>[] {
    const docFragments = this.extractDocumentFragments(rawDipIndex);
    const fileFragments = this.extractFileFragments(rawDipIndex);

    return fileFragments.map(file => {
      const doc = docFragments.find(d => d["@_uuid"] === file._documentUuid);
      const pathInfo = doc ? this.extractDocumentMetadataPath(doc) : null;
      const metadataRelativePath = pathInfo?.path ? this.resolveRelativePath(pathInfo) : null;

      return {
        metadataRelativePath,
        map: (rawMetadataFragment: any) => {
          let extractedMetadata: Metadata[] = [];
          if (rawMetadataFragment) {
            extractedMetadata = this.extractDocumentMetadata(rawMetadataFragment);
          }
          const extractedHashes = this.hashMapper.map(extractedMetadata, file._documentUuid);
          const hash = extractedHashes.get(file["@_uuid"]);
          const physicalPath = `${file._basePath}/${file["#text"]}`;

          return new File(
            file["#text"],
            physicalPath,
            hash ?? "",
            file.isMain,
            file._documentUuid
          );
        }
      };
    });
  }

  private resolveRelativePath(extractedPath: { path: string, aipRoot: string }): string {
    if (extractedPath.aipRoot && extractedPath.path.startsWith(extractedPath.aipRoot)) {
      return extractedPath.path;
    }
    return `${extractedPath.aipRoot ? extractedPath.aipRoot + "/" : ""}${extractedPath.path}`;
  }

  private extractDocumentClassFragments(rawDipIndex: any): any[] {
    const classes = rawDipIndex?.DiPIndex?.PackageContent?.DiPDocuments?.DocumentClass;
    if (!classes) return [];
    return Array.isArray(classes) ? classes : [classes];
  }

  private extractProcessFragments(rawDipIndex: any): any[] {
    const classes = this.extractDocumentClassFragments(rawDipIndex);
    const fragments: any[] = [];
    for (const dc of classes) {
      if (dc.AiP) {
        const aips = Array.isArray(dc.AiP) ? dc.AiP : [dc.AiP];
        for (const aip of aips) {
          fragments.push({
            ...aip,
            _documentClassUuid: dc["@_uuid"]
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
      if (p.Document) {
        const docs = Array.isArray(p.Document) ? p.Document : [p.Document];
        for (const doc of docs) {
          fragments.push({
            ...doc,
            _processUuid: p["@_uuid"],
            _aipRoot: p.AiPRoot
          });
        }
      }
    }
    return fragments;
  }

  private extractDocumentMetadataPath(rawDocumentFragment: any): { path: string; aipRoot: string; processUuid: string } {
    return {
      path: `${rawDocumentFragment.DocumentPath}/${rawDocumentFragment.Files?.Metadata?.["#text"]}`,
      aipRoot: rawDocumentFragment._aipRoot || "",
      processUuid: rawDocumentFragment._processUuid || ""
    };
  }

  private extractFileFragments(rawDipIndex: any): any[] {
    const documents = this.extractDocumentFragments(rawDipIndex);
    const fragments: any[] = [];
    for (const doc of documents) {
      const files = doc.Files;
      if (files?.Primary) {
        fragments.push({
          ...files.Primary,
          _documentUuid: doc["@_uuid"],
          _basePath: doc.DocumentPath,
          _aipRoot: doc._aipRoot,
          isMain: true
        });
      }
      if (files?.Attachments) {
        const atts = Array.isArray(files.Attachments) ? files.Attachments : [files.Attachments];
        for (const att of atts) {
          fragments.push({
            ...att,
            _documentUuid: doc["@_uuid"],
            _basePath: doc.DocumentPath,
            _aipRoot: doc._aipRoot,
            isMain: false
          });
        }
      }
    }
    return fragments;
  }

  private extractDocumentMetadata(rawMetadataFragment: any): Metadata[] {
    if (!rawMetadataFragment?.Document?.[0]) return [];
    const root =
      rawMetadataFragment.Document[0].DocumentDocumentoAmministrativoInformatico ||
      rawMetadataFragment.Document[0].DocumentoInformatico ||
      rawMetadataFragment.Document[0].AggregazioneDocumentaliInformatiche;

    if (!root) return [];
    return this.extractMetadataDict(root, true);
  }

  private extractProcessMetadata(rawMetadataFragment: any): Metadata[] {
    const root = rawMetadataFragment?.AiPInfo;
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
            return filterUuid ? [new Metadata(key, nested, MetadataType.COMPOSITE)] : nested;
          }
          return [new Metadata(key, String(item), this.getMetadataType(item))];
        });
        return filterUuid ? nestedList : [new Metadata(key, nestedList, MetadataType.COMPOSITE)];
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
