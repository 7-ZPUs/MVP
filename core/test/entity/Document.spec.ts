import { describe, expect, it } from "vitest";
import { Document, DocumentRow } from "../../src/entity/Document";
import { IntegrityStatusEnum } from "../../src/value-objects/IntegrityStatusEnum";
import { Metadata, MetadataType } from "../../src/value-objects/Metadata";

const meta = [
  new Metadata("autore", "Mario Rossi"),
  new Metadata("anno", "2024", MetadataType.NUMBER),
];

describe("Document entity", () => {
  describe("constructor", () => {
    // identifier: TU-F-browsing-08
    // method_name: constructor
    // description: should assegna uuid, metadata e processUuid
    // expected_value: matches asserted behavior: assegna uuid, metadata e processUuid
    it("TU-F-browsing-08: constructor should assegna uuid, metadata e processUuid", () => {
      const doc = new Document("doc-uuid", meta, "process-uuid");
      expect(doc.getUuid()).toBe("doc-uuid");
      expect(doc.getMetadata()).toBe(meta);
      expect(doc.getProcessUuid()).toBe("process-uuid");
    });

    // identifier: TU-F-browsing-09
    // method_name: constructor
    // description: should imposta integrityStatus a UNKNOWN di default
    // expected_value: matches asserted behavior: imposta integrityStatus a UNKNOWN di default
    it("TU-F-browsing-09: constructor should imposta integrityStatus a UNKNOWN di default", () => {
      const doc = new Document("doc-uuid", [], "process-uuid");
      expect(doc.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
    });

    // identifier: TU-F-browsing-10
    // method_name: constructor
    // description: should id è null finché non viene persistito
    // expected_value: matches asserted behavior: id è null finché non viene persistito
    it("TU-F-browsing-10: constructor should id è null finché non viene persistito", () => {
      const doc = new Document("doc-uuid", [], "process-uuid");
      expect(doc.getId()).toBeNull();
    });
  });

  describe("fromDB", () => {
    // identifier: TU-F-browsing-11
    // method_name: fromDB()
    // description: should ricostruisce correttamente da una riga del database
    // expected_value: matches asserted behavior: ricostruisce correttamente da una riga del database
    it("TU-F-browsing-11: fromDB() should ricostruisce correttamente da una riga del database", () => {
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

    // identifier: TU-F-browsing-12
    // method_name: fromDB()
    // description: should usa UNKNOWN se integrityStatus è assente nella riga
    // expected_value: matches asserted behavior: usa UNKNOWN se integrityStatus è assente nella riga
    it("TU-F-browsing-12: fromDB() should usa UNKNOWN se integrityStatus è assente nella riga", () => {
      const row: DocumentRow = { id: 5, uuid: "x", processId: 1 };
      const doc = Document.fromDB(row, []);
      expect(doc.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
    });
  });

  describe("setIntegrityStatus", () => {
    // identifier: TU-F-browsing-13
    // method_name: setIntegrityStatus()
    // description: should aggiorna lo stato di integrità
    // expected_value: matches asserted behavior: aggiorna lo stato di integrità
    it("TU-F-browsing-13: setIntegrityStatus() should aggiorna lo stato di integrità", () => {
      const doc = new Document("uuid", [], "process-uuid");
      doc.setIntegrityStatus(IntegrityStatusEnum.INVALID);
      expect(doc.getIntegrityStatus()).toBe(IntegrityStatusEnum.INVALID);
    });
  });
});
