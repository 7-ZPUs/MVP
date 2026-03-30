import { describe, expect, it } from "vitest";

import { EntityToDtoConverter } from "../../../src/repo/impl/EntityToDtoConverter";
import { Dip } from "../../../src/entity/Dip";
import { DocumentClass } from "../../../src/entity/DocumentClass";
import { Document } from "../../../src/entity/Document";
import { File } from "../../../src/entity/File";
import { Process } from "../../../src/entity/Process";
import { Metadata, MetadataType } from "../../../src/value-objects/Metadata";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";
import type { MetadataDTO } from "../../../src/dto/MetadataDTO";

describe("EntityToDtoConverter", () => {
  describe("dipToDto", () => {
    it("converts a persisted dip", () => {
      const dip = new Dip("dip-uuid", IntegrityStatusEnum.VALID, 1);

      const dto = EntityToDtoConverter.dipToDto(dip);

      expect(dto.id).toBe(1);
      expect(dto.uuid).toBe("dip-uuid");
      expect(dto.integrityStatus).toBe(IntegrityStatusEnum.VALID);
    });

    it("throws when dip id is null", () => {
      const dip = new Dip("dip-uuid");

      expect(() => EntityToDtoConverter.dipToDto(dip)).toThrow(
        "Cannot convert Dip to DTO: id is null",
      );
    });
  });

  describe("documentClassToDto", () => {
    it("converts a persisted document class", () => {
      const entity = new DocumentClass(
        "dip-uuid",
        "dc-uuid",
        "Ricevute",
        "2025-03-01T08:00:00Z",
        IntegrityStatusEnum.INVALID,
        2,
        1,
      );

      const dto = EntityToDtoConverter.documentClassToDto(entity);

      expect(dto.id).toBe(2);
      expect(dto.dipId).toBe(1);
      expect(dto.uuid).toBe("dc-uuid");
      expect(dto.name).toBe("Ricevute");
      expect(dto.timestamp).toBe("2025-03-01T08:00:00Z");
      expect(dto.integrityStatus).toBe(IntegrityStatusEnum.INVALID);
    });

    it("throws when id or dipId is null", () => {
      const entity = new DocumentClass(
        "dip-uuid",
        "dc-uuid",
        "Nome",
        "2024-01-01T00:00:00Z",
      );

      expect(() => EntityToDtoConverter.documentClassToDto(entity)).toThrow(
        "Cannot convert DocumentClass to DTO: id or dipId is null",
      );
    });
  });

  describe("documentToDto", () => {
    it("converts a persisted document", () => {
      const metadata = new Metadata(
        "DocumentoInformatico",
        [
          new Metadata("autore", "Mario Rossi", MetadataType.STRING),
          new Metadata("anno", "2025", MetadataType.NUMBER),
        ],
        MetadataType.COMPOSITE,
      );
      const entity = new Document(
        "doc-uuid",
        metadata,
        "proc-uuid",
        IntegrityStatusEnum.VALID,
        5,
        10,
      );

      const dto = EntityToDtoConverter.documentToDto(entity);

      expect(dto.id).toBe(5);
      expect(dto.processId).toBe(10);
      expect(dto.uuid).toBe("doc-uuid");
      expect(dto.integrityStatus).toBe(IntegrityStatusEnum.VALID);
      expect(dto.metadata.name).toBe("DocumentoInformatico");
      expect(Array.isArray(dto.metadata.value)).toBe(true);
      expect((dto.metadata.value as MetadataDTO[]).length).toBe(2);
    });

    it("throws when id or processId is null", () => {
      const entity = new Document(
        "doc-uuid",
        new Metadata("root", [], MetadataType.COMPOSITE),
        "proc-uuid",
      );

      expect(() => EntityToDtoConverter.documentToDto(entity)).toThrow(
        "Cannot convert Document to DTO: id or processId is null",
      );
    });
  });

  describe("fileToDto", () => {
    it("converts a persisted file", () => {
      const entity = new File(
        "documento.pdf",
        "/docs/documento.pdf",
        "abc123hash",
        true,
        "file-uuid",
        "doc-uuid",
        IntegrityStatusEnum.VALID,
        7,
        5,
      );

      const dto = EntityToDtoConverter.fileToDto(entity);

      expect(dto.id).toBe(7);
      expect(dto.documentId).toBe(5);
      expect(dto.filename).toBe("documento.pdf");
      expect(dto.path).toBe("/docs/documento.pdf");
      expect(dto.hash).toBe("abc123hash");
      expect(dto.integrityStatus).toBe(IntegrityStatusEnum.VALID);
      expect(dto.isMain).toBe(true);
    });

    it("throws when id or documentId is null", () => {
      const entity = new File(
        "file.pdf",
        "/file.pdf",
        "hash123",
        true,
        "file-uuid",
        "doc-uuid",
      );

      expect(() => EntityToDtoConverter.fileToDto(entity)).toThrow(
        "Cannot convert File to DTO: id or documentId is null",
      );
    });
  });

  describe("processToDto", () => {
    it("converts a persisted process", () => {
      const metadata = new Metadata(
        "Processo",
        [
          new Metadata("fase", "Acquisizione", MetadataType.STRING),
          new Metadata("ordine", "1", MetadataType.NUMBER),
        ],
        MetadataType.COMPOSITE,
      );
      const entity = new Process(
        "dc-uuid",
        "proc-uuid",
        metadata,
        IntegrityStatusEnum.VALID,
        10,
        2,
      );

      const dto = EntityToDtoConverter.processToDto(entity);

      expect(dto.id).toBe(10);
      expect(dto.documentClassId).toBe(2);
      expect(dto.uuid).toBe("proc-uuid");
      expect(dto.integrityStatus).toBe(IntegrityStatusEnum.VALID);
      expect(dto.metadata.name).toBe("Processo");
      expect(Array.isArray(dto.metadata.value)).toBe(true);
      expect((dto.metadata.value as MetadataDTO[]).length).toBe(2);
    });

    it("throws when id or documentClassId is null", () => {
      const entity = new Process(
        "dc-uuid",
        "proc-uuid",
        new Metadata("root", [], MetadataType.COMPOSITE),
      );

      expect(() => EntityToDtoConverter.processToDto(entity)).toThrow(
        "Cannot convert Process to DTO: id or documentClassId is null",
      );
    });
  });

  describe("metadataToDto", () => {
    it("converts STRING metadata", () => {
      const metadata = new Metadata(
        "autore",
        "Mario Rossi",
        MetadataType.STRING,
      );

      const dto = EntityToDtoConverter.metadataToDto(metadata);

      expect(dto.name).toBe("autore");
      expect(dto.value).toBe("Mario Rossi");
      expect(dto.type).toBe(MetadataType.STRING);
    });

    it("converts NUMBER metadata", () => {
      const metadata = new Metadata("anno", "2025", MetadataType.NUMBER);

      const dto = EntityToDtoConverter.metadataToDto(metadata);

      expect(dto.name).toBe("anno");
      expect(dto.value).toBe("2025");
      expect(dto.type).toBe(MetadataType.NUMBER);
    });

    it("converts BOOLEAN metadata", () => {
      const metadata = new Metadata("firmato", "true", MetadataType.BOOLEAN);

      const dto = EntityToDtoConverter.metadataToDto(metadata);

      expect(dto.name).toBe("firmato");
      expect(dto.value).toBe("true");
      expect(dto.type).toBe(MetadataType.BOOLEAN);
    });

    it("converts COMPOSITE metadata recursively", () => {
      const metadata = new Metadata(
        "root",
        [
          new Metadata("child1", "v1", MetadataType.STRING),
          new Metadata(
            "nested",
            [new Metadata("child2", "v2", MetadataType.STRING)],
            MetadataType.COMPOSITE,
          ),
        ],
        MetadataType.COMPOSITE,
      );

      const dto = EntityToDtoConverter.metadataToDto(metadata);

      expect(dto.name).toBe("root");
      expect(dto.type).toBe(MetadataType.COMPOSITE);
      expect(Array.isArray(dto.value)).toBe(true);
      expect((dto.value as any[]).length).toBe(2);
    });
  });
});
