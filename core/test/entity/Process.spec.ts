import { describe, expect, it } from "vitest";
import { Process } from "../../src/entity/Process";
import { IntegrityStatusEnum } from "../../src/value-objects/IntegrityStatusEnum";
import { Metadata, MetadataType } from "../../src/value-objects/Metadata";

const meta = new Metadata(
  "root",
  [
    new Metadata("tipo", "verbale"),
    new Metadata("anno", "2025", MetadataType.NUMBER),
  ],
  MetadataType.COMPOSITE,
);
const emptyMeta = new Metadata("root", [], MetadataType.COMPOSITE);

describe("Process entity", () => {
  describe("constructor", () => {
    // identifier: TU-F-browsing-33
    // method_name: assegna()
    // description: should assegna documentClassUuid, uuid e metadata
    // expected_value: matches asserted behavior: assegna documentClassUuid, uuid e metadata
    it("TU-F-browsing-33: assegna() should assegna documentClassUuid, uuid e metadata", () => {
      const proc = new Process("dc-uuid", "proc-uuid", meta);
      expect(proc.getDocumentClassUuid()).toBe("dc-uuid");
      expect(proc.getUuid()).toBe("proc-uuid");
      expect(proc.getMetadata()).toBe(meta);
    });

    // identifier: TU-F-browsing-34
    // method_name: imposta()
    // description: should imposta integrityStatus a UNKNOWN di default
    // expected_value: matches asserted behavior: imposta integrityStatus a UNKNOWN di default
    it("TU-F-browsing-34: imposta() should imposta integrityStatus a UNKNOWN di default", () => {
      const proc = new Process("dc-uuid", "uuid", emptyMeta);
      expect(proc.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
    });

    // identifier: TU-F-browsing-35
    // method_name: id()
    // description: should id è null finché non viene persistito
    // expected_value: matches asserted behavior: id è null finché non viene persistito
    it("TU-F-browsing-35: id() should id è null finché non viene persistito", () => {
      const proc = new Process("dc-uuid", "uuid", emptyMeta);
      expect(proc.getId()).toBeNull();
    });
  });

  describe("setIntegrityStatus", () => {
    // identifier: TU-F-browsing-38
    // method_name: aggiorna()
    // description: should aggiorna lo stato di integrità
    // expected_value: matches asserted behavior: aggiorna lo stato di integrità
    it("TU-F-browsing-38: aggiorna() should aggiorna lo stato di integrità", () => {
      const proc = new Process("dc-uuid", "uuid", emptyMeta);
      proc.setIntegrityStatus(IntegrityStatusEnum.INVALID);
      expect(proc.getIntegrityStatus()).toBe(IntegrityStatusEnum.INVALID);
    });
  });
});
