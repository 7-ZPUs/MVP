import { describe, expect, it } from "vitest";
import { Document } from "../../src/entity/Document";
import { IntegrityStatusEnum } from "../../src/value-objects/IntegrityStatusEnum";
import { Metadata, MetadataType } from "../../src/value-objects/Metadata";

const meta = new Metadata("root", [
  new Metadata("autore", "Mario Rossi"),
  new Metadata("anno", "2024", MetadataType.NUMBER),
]);

describe("Document entity", () => {
  describe("constructor", () => {
    // identifier: TU-F-browsing-08
    // method_name: assegna()
    // description: should assegna uuid, metadata e processUuid
    // expected_value: matches asserted behavior: assegna uuid, metadata e processUuid
    it("TU-F-browsing-08: assegna() should assegna uuid, metadata e processUuid", () => {
      const doc = new Document("doc-uuid", meta, "process-uuid");
      expect(doc.getUuid()).toBe("doc-uuid");
      expect(doc.getMetadata()).toBe(meta);
      expect(doc.getProcessUuid()).toBe("process-uuid");
    });

    // identifier: TU-F-browsing-09
    // method_name: imposta()
    // description: should imposta integrityStatus a UNKNOWN di default
    // expected_value: matches asserted behavior: imposta integrityStatus a UNKNOWN di default
    it("TU-F-browsing-09: imposta() should imposta integrityStatus a UNKNOWN di default", () => {
      const doc = new Document("doc-uuid", [], "process-uuid");
      expect(doc.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
    });

    // identifier: TU-F-browsing-10
    // method_name: id()
    // description: should id è null finché non viene persistito
    // expected_value: matches asserted behavior: id è null finché non viene persistito
    it("TU-F-browsing-10: id() should id è null finché non viene persistito", () => {
      const doc = new Document("doc-uuid", [], "process-uuid");
      expect(doc.getId()).toBeNull();
    });
  });

  describe("setIntegrityStatus", () => {
    // identifier: TU-F-browsing-13
    // method_name: aggiorna()
    // description: should aggiorna lo stato di integrità
    // expected_value: matches asserted behavior: aggiorna lo stato di integrità
    it("TU-F-browsing-13: aggiorna() should aggiorna lo stato di integrità", () => {
      const doc = new Document("uuid", [], "process-uuid");
      doc.setIntegrityStatus(IntegrityStatusEnum.INVALID);
      expect(doc.getIntegrityStatus()).toBe(IntegrityStatusEnum.INVALID);
    });
  });
});
