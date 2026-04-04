import { DocumentDTO } from "../../dto/DocumentDTO";
import { Document } from "../../entity/Document";
import { IntegrityStatusEnum } from "../../value-objects/IntegrityStatusEnum";
import { Metadata, MetadataType } from "../../value-objects/Metadata";
import { MetadataPersistenceRow, MetadataMapper } from "./MetadataMapper";
import {
  DocumentSearchResult,
  DocumentTypeEnum,
} from "../../../../shared/domain/metadata/search.models";

export interface DocumentPersistenceRow {
  id: number;
  uuid: string;
  integrityStatus?: string;
  processId: number;
  processUuid: string;
}

export interface DocumentPersistenceModel {
  uuid: string;
  integrityStatus: IntegrityStatusEnum;
  processUuid: string;
  metadata: Metadata[];
}

export interface DocumentJsonPersistenceRow extends DocumentPersistenceRow {
  metadataJson: string;
}

export class DocumentMapper {
  static fromPersistence(
    row: DocumentPersistenceRow,
    metadata: MetadataPersistenceRow[],
  ): Document {
    return new Document(
      row.uuid,
      MetadataMapper.fromFlatRows(metadata),
      row.processUuid,
      row.integrityStatus
        ? IntegrityStatusEnum[
            row.integrityStatus as keyof typeof IntegrityStatusEnum
          ] || IntegrityStatusEnum.UNKNOWN
        : IntegrityStatusEnum.UNKNOWN,
      row.id,
      row.processId,
    );
  }

  static toDTO(document: Document): DocumentDTO {
    const id = document.getId();
    if (id === null) {
      throw new Error(
        "Cannot convert to DTO: Document entity is not yet persisted and has no ID.",
      );
    }

    return {
      id,
      uuid: document.getUuid(),
      integrityStatus: document.getIntegrityStatus(),
      metadata: MetadataMapper.toDTO(document.getMetadata()),
      processId: document.getProcessId() ?? -1,
    };
  }

  static toPersistence(document: Document): DocumentPersistenceModel {
    const temp = {
      uuid: document.getUuid(),
      integrityStatus: document.getIntegrityStatus(),
      processUuid: document.getProcessUuid(),
      metadata: MetadataMapper.flatten(document.getMetadata()),
    };
    return temp;
  }

  static toSearchResult(
    document: Document,
    score: number | null,
  ): DocumentSearchResult {
    const id = document.getId();
    if (id === null) {
      throw new Error(
        "Cannot convert to SearchResult: Document entity is not yet persisted and has no ID.",
      );
    }

    const metadata = document.getMetadata();
    const name =
      metadata.findNodeByName("NomeDelDocumento")?.getStringValue() ??
      metadata.findNodeByName("nome")?.getStringValue() ??
      "";

    return {
      id,
      uuid: document.getUuid(),
      integrityStatus: document.getIntegrityStatus(),
      name,
      type: this.mapRootMetadataType(metadata),
      score,
    };
  }

  static metadataToJson(metadata: Metadata): Record<string, unknown> {
    return {
      [metadata.getName()]: this.metadataNodeToJsonValue(metadata),
    };
  }

  static metadataJsonToRoot(metadataJson: string): Metadata {
    let parsed: unknown;
    try {
      parsed = JSON.parse(metadataJson);
    } catch {
      return new Metadata("Metadata", [], MetadataType.COMPOSITE);
    }

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return new Metadata("Metadata", [], MetadataType.COMPOSITE);
    }

    const entries = Object.entries(parsed as Record<string, unknown>);

    if (entries.length === 1) {
      const [key, value] = entries[0];
      return this.metadataJsonEntryToMetadata(key, value);
    }

    const children = entries.map(([key, value]) =>
      this.metadataJsonEntryToMetadata(key, value),
    );

    return new Metadata("Metadata", children, MetadataType.COMPOSITE);
  }

  static fromJsonPersistence(row: DocumentJsonPersistenceRow): Document {
    return new Document(
      row.uuid,
      this.metadataJsonToRoot(row.metadataJson),
      row.processUuid,
      row.integrityStatus
        ? IntegrityStatusEnum[
            row.integrityStatus as keyof typeof IntegrityStatusEnum
          ] || IntegrityStatusEnum.UNKNOWN
        : IntegrityStatusEnum.UNKNOWN,
      row.id,
      row.processId,
    );
  }

  private static metadataNodeToJsonValue(node: Metadata): unknown {
    if (node.getType() !== MetadataType.COMPOSITE) {
      return this.metadataLeafValue(node);
    }

    const nested: Record<string, unknown> = {};
    for (const child of node.getChildren()) {
      nested[child.getName()] = this.metadataNodeToJsonValue(child);
    }

    return nested;
  }

  private static metadataLeafValue(node: Metadata): string | number | boolean {
    const rawValue = node.getStringValue();

    if (node.getType() === MetadataType.NUMBER) {
      const parsed = Number(rawValue);
      return Number.isFinite(parsed) ? parsed : rawValue;
    }

    if (node.getType() === MetadataType.BOOLEAN) {
      const lower = rawValue.toLowerCase();
      if (lower === "true") return true;
      if (lower === "false") return false;
    }

    return rawValue;
  }

  private static metadataJsonEntryToMetadata(
    key: string,
    value: unknown,
  ): Metadata {
    if (typeof value === "number") {
      return new Metadata(key, String(value), MetadataType.NUMBER);
    }

    if (typeof value === "boolean") {
      return new Metadata(key, String(value), MetadataType.BOOLEAN);
    }

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      const nestedChildren = Object.entries(
        value as Record<string, unknown>,
      ).map(([nestedKey, nestedValue]) =>
        this.metadataJsonEntryToMetadata(nestedKey, nestedValue),
      );
      return new Metadata(key, nestedChildren, MetadataType.COMPOSITE);
    }

    return new Metadata(
      key,
      value === null ? "" : String(value),
      MetadataType.STRING,
    );
  }

  private static mapRootMetadataType(metadata: Metadata): DocumentTypeEnum {
    const rootName = metadata.getName();
    if ((Object.values(DocumentTypeEnum) as string[]).includes(rootName)) {
      return rootName as DocumentTypeEnum;
    }

    throw new Error(
      `Invalid document metadata root type '${rootName}'. Expected one of: ${Object.values(
        DocumentTypeEnum,
      ).join(", ")}.`,
    );
  }
}
