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
    // identifier: TU-F-B-64
    // method_name: assegna()
    // description: assegna uuid, metadata e processUuid
    // expected_value: matches asserted behavior: assegna uuid, metadata e processUuid
    it("assegna uuid, metadata e processUuid", () => {
      const doc = new Document("doc-uuid", meta, "process-uuid");
      expect(doc.getUuid()).toBe("doc-uuid");
      expect(doc.getMetadata()).toBe(meta);
      expect(doc.getProcessUuid()).toBe("process-uuid");
    });

    // identifier: TU-F-B-65
    // method_name: imposta()
    // description: imposta integrityStatus a UNKNOWN di default
    // expected_value: matches asserted behavior: imposta integrityStatus a UNKNOWN di default
    it("imposta integrityStatus a UNKNOWN di default", () => {
      const doc = new Document("doc-uuid", [], "process-uuid");
      expect(doc.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
    });

    // identifier: TU-F-B-66
    // method_name: id()
    // description: id è null finché non viene persistito
    // expected_value: matches asserted behavior: id è null finché non viene persistito
    it("id è null finché non viene persistito", () => {
      const doc = new Document("doc-uuid", [], "process-uuid");
      expect(doc.getId()).toBeNull();
    });
  });

  describe("fromDB", () => {
    // identifier: TU-F-B-67
    // method_name: ricostruisce()
    // description: ricostruisce correttamente da una riga del database
    // expected_value: matches asserted behavior: ricostruisce correttamente da una riga del database
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

    // identifier: TU-F-B-68
    // method_name: usa()
    // description: usa UNKNOWN se integrityStatus è assente nella riga
    // expected_value: matches asserted behavior: usa UNKNOWN se integrityStatus è assente nella riga
    it("usa UNKNOWN se integrityStatus è assente nella riga", () => {
      const row: DocumentRow = { id: 5, uuid: "x", processId: 1 };
      const doc = Document.fromDB(row, []);
      expect(doc.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
    });
  });

  describe("setIntegrityStatus", () => {
    // identifier: TU-F-B-69
    // method_name: aggiorna()
    // description: aggiorna lo stato di integrità
    // expected_value: matches asserted behavior: aggiorna lo stato di integrità
    it("aggiorna lo stato di integrità", () => {
      const doc = new Document("uuid", [], "process-uuid");
      doc.setIntegrityStatus(IntegrityStatusEnum.INVALID);
      expect(doc.getIntegrityStatus()).toBe(IntegrityStatusEnum.INVALID);
    });
  });

  describe("toDTO", () => {
    // identifier: TU-F-B-70
    // method_name: lancia()
    // description: lancia un errore se id è null
    // expected_value: matches asserted behavior: lancia un errore se id è null
    it("lancia un errore se id è null", () => {
      const doc = new Document("uuid", [], "process-uuid");
      expect(() => doc.toDTO()).toThrow(
        "Cannot convert to DTO: Document entity is not yet persisted and has no ID.",
      );
    });

    // identifier: TU-F-B-71
    // method_name: restituisce()
    // description: restituisce il DTO corretto
    // expected_value: matches asserted behavior: restituisce il DTO corretto
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
