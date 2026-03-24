import { describe, expect, it } from "vitest";
import { Document, DocumentRow } from "../../../src/entity/Document";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";
import { Metadata, MetadataType } from "../../../src/value-objects/Metadata";

const meta = [
  new Metadata("autore", "Mario Rossi"),
  new Metadata("anno", "2024", MetadataType.NUMBER),
];

describe("Document entity", () => {
  describe("constructor", () => {
    it("assegna uuid, metadata e processId", () => {
      const doc = new Document("doc-uuid", meta, 7);
      expect(doc.getUuid()).toBe("doc-uuid");
      expect(doc.getMetadata()).toBe(meta);
      expect(doc.getProcessId()).toBe(7);
    });

    it("imposta integrityStatus a UNKNOWN di default", () => {
      const doc = new Document("doc-uuid", [], 1);
      expect(doc.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
    });

    it("id è null finché non viene persistito", () => {
      const doc = new Document("doc-uuid", [], 1);
      expect(doc.getId()).toBeNull();
    });
  });

  describe("fromDB", () => {
    it("ricostruisce correttamente da una riga del database", () => {
      const row: DocumentRow = {
        id: 10,
        uuid: "doc-uuid",
        integrityStatus: "VALID",
        processId: 3,
      };
      const doc = Document.fromDB(row, meta);

      expect(doc.getId()).toBe(10);
      expect(doc.getUuid()).toBe("doc-uuid");
      expect(doc.getIntegrityStatus()).toBe(IntegrityStatusEnum.VALID);
      expect(doc.getProcessId()).toBe(3);
      expect(doc.getMetadata()).toBe(meta);
    });

    it("usa UNKNOWN se integrityStatus è assente nella riga", () => {
      const row: DocumentRow = { id: 5, uuid: "x", processId: 1 };
      const doc = Document.fromDB(row, []);
      expect(doc.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
    });
  });

  describe("setIntegrityStatus", () => {
    it("aggiorna lo stato di integrità", () => {
      const doc = new Document("uuid", [], 1);
      doc.setIntegrityStatus(IntegrityStatusEnum.INVALID);
      expect(doc.getIntegrityStatus()).toBe(IntegrityStatusEnum.INVALID);
    });
  });

  describe("toDTO", () => {
    it("lancia un errore se id è null", () => {
      const doc = new Document("uuid", [], 1);
      expect(() => doc.toDTO()).toThrow(
        "Cannot convert to DTO: Document entity is not yet persisted and has no ID.",
      );
    });

    it("restituisce il DTO corretto", () => {
      const row: DocumentRow = {
        id: 2,
        uuid: "doc-abc",
        integrityStatus: "INVALID",
        processId: 5,
      };
      const doc = Document.fromDB(row, meta);

      const dto = doc.toDTO();

      expect(dto.id).toBe(2);
      expect(dto.uuid).toBe("doc-abc");
      expect(dto.integrityStatus).toBe(IntegrityStatusEnum.INVALID);
      expect(dto.processId).toBe(5);
      expect(dto.metadata).toHaveLength(2);
      expect(dto.metadata[0].name).toBe("autore");
      expect(dto.metadata[1].name).toBe("anno");
    });
  });
});
