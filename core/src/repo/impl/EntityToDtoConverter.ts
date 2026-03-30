/**
 * EntityToDtoConverter — Centralized conversion from domain entities to DTOs
 *
 * Responsabilità:
 * - Convertire domain entities in DTOs per IPC e altri boundary
 * - Gestire la conversione ricorsiva di Metadata
 * - Non è usato internamente nei repository o use case — solo per IPC adapter
 */

import { Dip } from "../../entity/Dip";
import { DocumentClass } from "../../entity/DocumentClass";
import { Document } from "../../entity/Document";
import { File } from "../../entity/File";
import { Process } from "../../entity/Process";
import { Metadata, MetadataType } from "../../value-objects/Metadata";

import type { DipDTO } from "../../dto/DipDTO";
import type { DocumentClassDTO } from "../../dto/DocumentClassDTO";
import type { DocumentDTO } from "../../dto/DocumentDTO";
import type { FileDTO } from "../../dto/FileDTO";
import type { ProcessDTO } from "../../dto/ProcessDTO";
import type { MetadataDTO } from "../../dto/MetadataDTO";

export class EntityToDtoConverter {
  static dipToDto(dip: Dip): DipDTO {
    const id = dip.getId();
    if (id === null) {
      throw new Error("Cannot convert Dip to DTO: id is null");
    }
    return {
      id,
      uuid: dip.getUuid(),
      integrityStatus: dip.getIntegrityStatus(),
    };
  }

  static documentClassToDto(docClass: DocumentClass): DocumentClassDTO {
    const id = docClass.getId();
    const dipId = docClass.getDipId();
    if (id === null || dipId === null) {
      throw new Error(
        "Cannot convert DocumentClass to DTO: id or dipId is null",
      );
    }
    return {
      id,
      dipId,
      uuid: docClass.getUuid(),
      name: docClass.getName(),
      timestamp: docClass.getTimestamp(),
      integrityStatus: docClass.getIntegrityStatus(),
    };
  }

  static documentToDto(document: Document): DocumentDTO {
    const id = document.getId();
    const processId = document.getProcessId();
    if (id === null || processId === null) {
      throw new Error(
        "Cannot convert Document to DTO: id or processId is null",
      );
    }
    return {
      id,
      processId,
      uuid: document.getUuid(),
      integrityStatus: document.getIntegrityStatus(),
      metadata: this.metadataToDto(document.getMetadata()),
    };
  }

  static fileToDto(file: File): FileDTO {
    const id = file.getId();
    const documentId = file.getDocumentId();
    if (id === null || documentId === null) {
      throw new Error("Cannot convert File to DTO: id or documentId is null");
    }
    return {
      id,
      documentId,
      filename: file.getFilename(),
      path: file.getPath(),
      hash: file.getHash(),
      integrityStatus: file.getIntegrityStatus(),
      isMain: file.getIsMain(),
    };
  }

  static processToDto(process: Process): ProcessDTO {
    const id = process.getId();
    const documentClassId = process.getDocumentClassId();
    if (id === null || documentClassId === null) {
      throw new Error(
        "Cannot convert Process to DTO: id or documentClassId is null",
      );
    }
    return {
      id,
      documentClassId,
      uuid: process.getUuid(),
      integrityStatus: process.getIntegrityStatus(),
      metadata: this.metadataToDto(process.getMetadata()),
    };
  }

  static metadataToDto(metadata: Metadata): MetadataDTO {
    const type = metadata.getType();
    const dtoValue =
      type === MetadataType.COMPOSITE
        ? metadata.getChildren().map((child) => this.metadataToDto(child))
        : metadata.getStringValue();

    return {
      name: metadata.getName(),
      value: dtoValue,
      type,
    };
  }
}
