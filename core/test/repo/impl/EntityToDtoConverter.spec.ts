import { describe, expect, it } from "vitest";
import { EntityToDtoConverter } from "../../../src/repo/impl/EntityToDtoConverter";
import { Dip } from "../../../src/entity/Dip";
import { DocumentClass } from "../../../src/entity/DocumentClass";
import { Document } from "../../../src/entity/Document";
import { File } from "../../../src/entity/File";
import { Process } from "../../../src/entity/Process";
import { Metadata, MetadataType } from "../../../src/value-objects/Metadata";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";

describe("EntityToDtoConverter", () => {
  describe("dipToDto", () => {
    // identifier: TU-F-converter-01
    // method_name: dipToDto()
    // description: should convertire un Dip entity a DipDTO correttamente
    // expected_value: matches asserted behavior: converte correttamente
    it("TU-F-converter-01: dipToDto() should convertire un Dip entity a DipDTO correttamente", () => {
      const dip = Dip.fromDB({
        id: 1,
        uuid: "test-uuid",
        integrityStatus: "VALID",
      });

      const dto = EntityToDtoConverter.dipToDto(dip);

      expect(dto.id).toBe(1);
      expect(dto.dipId).toBe(1);
      expect(dto.uuid).toBe("test-uuid");
      expect(dto.integrityStatus).toBe(IntegrityStatusEnum.VALID);
    });

    // identifier: TU-F-converter-02
    // method_name: dipToDto()
    // description: should lanciare errore se id è null
    // expected_value: throws error with message about null id
    it("TU-F-converter-02: dipToDto() should lanciare errore se id è null", () => {
      const dip = new Dip("test-uuid");

      expect(() => EntityToDtoConverter.dipToDto(dip)).toThrow(
        "Cannot convert Dip to DTO: id is null",
      );
    });

    it("keeps UNKNOWN integrity status", () => {
      const dip = new Dip("dip-uuid", IntegrityStatusEnum.UNKNOWN, 5);

      const dto = EntityToDtoConverter.dipToDto(dip);

      expect(dto.integrityStatus).toBe(IntegrityStatusEnum.UNKNOWN);
    });
  });

  describe("documentClassToDto", () => {
    // identifier: TU-F-converter-04
    // method_name: documentClassToDto()
    // description: should convertire un DocumentClass entity a DocumentClassDTO correttamente
    // expected_value: matches asserted behavior: converte correttamente
    it("TU-F-converter-04: documentClassToDto() should convertire un DocumentClass entity a DocumentClassDTO correttamente", () => {
      const dc = DocumentClass.fromDB({
        id: 2,
        dipId: 1,
        uuid: "dc-uuid",
        name: "Ricevute",
        timestamp: "2025-03-01T08:00:00Z",
        integrityStatus: "VALID",
      });

      const dto = EntityToDtoConverter.documentClassToDto(dc);

      expect(dto.id).toBe(2);
      expect(dto.dipId).toBe(1);
      expect(dto.uuid).toBe("dc-uuid");
      expect(dto.name).toBe("Ricevute");
      expect(dto.timestamp).toBe("2025-03-01T08:00:00Z");
      expect(dto.integrityStatus).toBe(IntegrityStatusEnum.VALID);
    });

    // identifier: TU-F-converter-05
    // method_name: documentClassToDto()
    // description: should lanciare errore se id è null
    // expected_value: throws error with message about null id
    it("TU-F-converter-05: documentClassToDto() should lanciare errore se id è null", () => {
      const dc = new DocumentClass(
        "dip-uuid",
        "dc-uuid",
        "Nome",
        "2024-01-01T00:00:00Z",
      );

      expect(() => EntityToDtoConverter.documentClassToDto(dc)).toThrow(
        "Cannot convert DocumentClass to DTO: id or dipId is null",
      );
    });

    // identifier: TU-F-converter-06
    // method_name: documentClassToDto()
    // description: should gestire INVALID integrity status
    // expected_value: returns DTO with INVALID status
    it("TU-F-converter-06: documentClassToDto() should gestire INVALID integrity status", () => {
      const dc = DocumentClass.fromDB({
        id: 3,
        dipId: 2,
        uuid: "dc-uuid-2",
        name: "Contratti",
        timestamp: "2025-04-01T08:00:00Z",
        integrityStatus: "INVALID",
      });

      const dto = EntityToDtoConverter.documentClassToDto(dc);

      expect(dto.integrityStatus).toBe(IntegrityStatusEnum.INVALID);
    });
  });

  describe("documentToDto", () => {
    // identifier: TU-F-converter-07
    // method_name: documentToDto()
    // description: should convertire un Document entity a DocumentDTO con metadati
    // expected_value: matches asserted behavior: converte correttamente
    it("TU-F-converter-07: documentToDto() should convertire un Document entity a DocumentDTO con metadati", () => {
      const metadata = new Metadata(
        "DocumentoInformatico",
        [
          new Metadata("autore", "Mario Rossi", MetadataType.STRING),
          new Metadata("anno", "2025", MetadataType.NUMBER),
        ],
        MetadataType.COMPOSITE,
      );
      const doc = Document.fromDB(
        {
          id: 5,
          uuid: "doc-uuid",
          integrityStatus: "VALID",
          processId: 10,
        },
        metadata,
      );

      const dto = EntityToDtoConverter.documentToDto(doc);

      expect(dto.id).toBe(5);
      expect(dto.processId).toBe(10);
      expect(dto.uuid).toBe("doc-uuid");
      expect(dto.integrityStatus).toBe(IntegrityStatusEnum.VALID);
      expect(dto.metadata).toBeDefined();
      expect(dto.metadata.name).toBe("DocumentoInformatico");
      expect(dto.metadata.value).toHaveLength(2);
    });

    // identifier: TU-F-converter-08
    // method_name: documentToDto()
    // description: should lanciare errore se id è null
    // expected_value: throws error with message about null id
    it("TU-F-converter-08: documentToDto() should lanciare errore se id è null", () => {
      const metadata = new Metadata("root", [], MetadataType.COMPOSITE);
      const doc = new Document("doc-uuid", metadata, "proc-uuid");

      expect(() => EntityToDtoConverter.documentToDto(doc)).toThrow(
        "Cannot convert Document to DTO: id or processId is null",
      );
    });

    it("converts document with empty composite metadata", () => {
      const entity = new Document(
        "doc-empty",
        new Metadata("root", [], MetadataType.COMPOSITE),
        "proc-uuid",
        IntegrityStatusEnum.UNKNOWN,
        6,
        11,
      );

      const dto = EntityToDtoConverter.documentToDto(entity);

      expect(dto.metadata.name).toBe("root");
      expect(Array.isArray(dto.metadata.value)).toBe(true);
      expect((dto.metadata.value as MetadataDTO[]).length).toBe(0);
    });
  });

  describe("fileToDto", () => {
    // identifier: TU-F-converter-10
    // method_name: fileToDto()
    // description: should convertire un File entity a FileDTO correttamente
    // expected_value: matches asserted behavior: converte correttamente
    it("TU-F-converter-10: fileToDto() should convertire un File entity a FileDTO correttamente", () => {
      const file = File.fromDB({
        id: 7,
        filename: "documento.pdf",
        path: "/docs/documento.pdf",
        hash: "abc123hash",
        integrityStatus: "VALID",
        isMain: 1,
        documentId: 5,
      });

      const dto = EntityToDtoConverter.fileToDto(file);

      expect(dto.id).toBe(7);
      expect(dto.documentId).toBe(5);
      expect(dto.filename).toBe("documento.pdf");
      expect(dto.path).toBe("/docs/documento.pdf");
      expect(dto.hash).toBe("abc123hash");
      expect(dto.integrityStatus).toBe(IntegrityStatusEnum.VALID);
      expect(dto.isMain).toBe(true);
    });

    // identifier: TU-F-converter-11
    // method_name: fileToDto()
    // description: should lanciare errore se id è null
    // expected_value: throws error with message about null id
    it("TU-F-converter-11: fileToDto() should lanciare errore se id è null", () => {
      const file = new File(
        "file.pdf",
        "/file.pdf",
        "hash123",
        true,
        "file-uuid",
        "doc-uuid",
      );

      expect(() => EntityToDtoConverter.fileToDto(file)).toThrow(
        "Cannot convert File to DTO: id or documentId is null",
      );
    });

    it("converts non-main attachment file", () => {
      const entity = new File(
        "allegato.txt",
        "/docs/allegato.txt",
        "def456hash",
        false,
        "file-uuid-2",
        "doc-uuid",
        IntegrityStatusEnum.INVALID,
        8,
        6,
      );

      const dto = EntityToDtoConverter.fileToDto(entity);

      expect(dto.isMain).toBe(false);
      expect(dto.integrityStatus).toBe(IntegrityStatusEnum.INVALID);
    });
  });

  describe("processToDto", () => {
    // identifier: TU-F-converter-13
    // method_name: processToDto()
    // description: should convertire un Process entity a ProcessDTO con metadati
    // expected_value: matches asserted behavior: converte correttamente
    it("TU-F-converter-13: processToDto() should convertire un Process entity a ProcessDTO con metadati", () => {
      const metadata = [
        new Metadata("fase", "Acquisizione", MetadataType.STRING),
        new Metadata("ordine", "1", MetadataType.NUMBER),
      ];
      const proc = Process.fromDB(
        {
          id: 10,
          documentClassId: 2,
          uuid: "proc-uuid",
          integrityStatus: "VALID",
        },
        metadata,
      );

      const dto = EntityToDtoConverter.processToDto(proc);

      expect(dto.id).toBe(10);
      expect(dto.documentClassId).toBe(2);
      expect(dto.uuid).toBe("proc-uuid");
      expect(dto.integrityStatus).toBe(IntegrityStatusEnum.VALID);
      expect(dto.metadata).toHaveLength(2);
      expect(dto.metadata[0].name).toBe("fase");
      expect(dto.metadata[0].value).toBe("Acquisizione");
      expect(dto.metadata[1].name).toBe("ordine");
      expect(dto.metadata[1].value).toBe("1");
    });

    // identifier: TU-F-converter-14
    // method_name: processToDto()
    // description: should lanciare errore se id è null
    // expected_value: throws error with message about null id
    it("TU-F-converter-14: processToDto() should lanciare errore se id è null", () => {
      const proc = new Process("dc-uuid", "proc-uuid", []);

      expect(() => EntityToDtoConverter.processToDto(proc)).toThrow(
        "Cannot convert Process to DTO: id or documentClassId is null",
      );
    });

    it("converts process with empty metadata children", () => {
      const entity = new Process(
        "dc-uuid",
        "proc-no-meta",
        new Metadata("ProcessoVuoto", [], MetadataType.COMPOSITE),
        IntegrityStatusEnum.UNKNOWN,
        11,
        3,
      );

      const dto = EntityToDtoConverter.processToDto(entity);

      expect(dto.metadata.name).toBe("ProcessoVuoto");
      expect(Array.isArray(dto.metadata.value)).toBe(true);
      expect((dto.metadata.value as MetadataDTO[]).length).toBe(0);
    });
  });

  describe("metadataToDto", () => {
    // identifier: TU-F-converter-16
    // method_name: metadataToDto()
    // description: should convertire un Metadata semplice (STRING) a MetadataDTO
    // expected_value: matches asserted behavior: converte correttamente
    it("TU-F-converter-16: metadataToDto() should convertire un Metadata semplice (STRING) a MetadataDTO", () => {
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

    // identifier: TU-F-converter-17
    // method_name: metadataToDto()
    // description: should convertire un Metadata numerico (NUMBER) a MetadataDTO
    // expected_value: matches asserted behavior: converte correttamente
    it("TU-F-converter-17: metadataToDto() should convertire un Metadata numerico (NUMBER) a MetadataDTO", () => {
      const metadata = new Metadata("anno", "2025", MetadataType.NUMBER);

      const dto = EntityToDtoConverter.metadataToDto(metadata);

      expect(dto.name).toBe("anno");
      expect(dto.value).toBe("2025");
      expect(dto.type).toBe(MetadataType.NUMBER);
    });

    // identifier: TU-F-converter-18
    // method_name: metadataToDto()
    // description: should convertire un Metadata booleano (BOOLEAN) a MetadataDTO
    // expected_value: matches asserted behavior: converte correttamente
    it("TU-F-converter-18: metadataToDto() should convertire un Metadata booleano (BOOLEAN) a MetadataDTO", () => {
      const metadata = new Metadata("riservato", "true", MetadataType.BOOLEAN);

      const dto = EntityToDtoConverter.metadataToDto(metadata);

      expect(dto.name).toBe("riservato");
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

    it("converts empty COMPOSITE metadata", () => {
      const metadata = new Metadata("emptyRoot", [], MetadataType.COMPOSITE);

      const dto = EntityToDtoConverter.metadataToDto(metadata);

      expect(dto.name).toBe("emptyRoot");
      expect(dto.type).toBe(MetadataType.COMPOSITE);
      expect(Array.isArray(dto.value)).toBe(true);
      expect((dto.value as MetadataDTO[]).length).toBe(0);
    });

    it("converts deeply nested metadata", () => {
      const metadata = new Metadata(
        "level1",
        [
          new Metadata(
            "level2",
            [
              new Metadata(
                "level3",
                [new Metadata("deep", "value", MetadataType.STRING)],
                MetadataType.COMPOSITE,
              ),
            ],
            MetadataType.COMPOSITE,
          ),
        ],
        MetadataType.COMPOSITE,
      );

      const dto = EntityToDtoConverter.metadataToDto(metadata);

      expect(dto.name).toBe("level1");
      const level2 = (dto.value as MetadataDTO[])[0];
      expect(level2.name).toBe("level2");
      const level3 = (level2.value as MetadataDTO[])[0];
      expect(level3.name).toBe("level3");
      const deep = (level3.value as MetadataDTO[])[0];
      expect(deep.name).toBe("deep");
      expect(deep.value).toBe("value");
    });
  });
});
