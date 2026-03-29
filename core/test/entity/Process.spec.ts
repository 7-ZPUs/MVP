import { describe, expect, it } from "vitest";
import { Process, ProcessRow } from "../../src/entity/Process";
import { IntegrityStatusEnum } from "../../src/value-objects/IntegrityStatusEnum";
import { Metadata, MetadataType } from "../../src/value-objects/Metadata";

const meta = [
  new Metadata("tipo", "verbale"),
  new Metadata("anno", "2025", MetadataType.NUMBER),
];

describe("Process entity", () => {
  describe("constructor", () => {
    // identifier: TU-F-browsing-33
    // method_name: constructor
    // description: should assegna documentClassUuid, uuid e metadata
    // expected_value: matches asserted behavior: assegna documentClassUuid, uuid e metadata
    it("TU-F-browsing-33: constructor should assegna documentClassUuid, uuid e metadata", () => {
      const proc = new Process("dc-uuid", "proc-uuid", meta);
      expect(proc.getDocumentClassUuid()).toBe("dc-uuid");
      expect(proc.getUuid()).toBe("proc-uuid");
      expect(proc.getMetadata()).toBe(meta);
    });

    // identifier: TU-F-browsing-34
    // method_name: constructor
    // description: should imposta integrityStatus a UNKNOWN di default
    // expected_value: matches asserted behavior: imposta integrityStatus a UNKNOWN di default
    it("TU-F-browsing-34: constructor should imposta integrityStatus a UNKNOWN di default", () => {
      const proc = new Process("dc-uuid", "uuid", []);
      expect(proc.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
    });

    // identifier: TU-F-browsing-35
    // method_name: constructor
    // description: should id è null finché non viene persistito
    // expected_value: matches asserted behavior: id è null finché non viene persistito
    it("TU-F-browsing-35: constructor should id è null finché non viene persistito", () => {
      const proc = new Process("dc-uuid", "uuid", []);
      expect(proc.getId()).toBeNull();
    });
  });

  describe("fromDB", () => {
    // identifier: TU-F-browsing-36
    // method_name: fromDB()
    // description: should ricostruisce correttamente da una riga del database
    // expected_value: matches asserted behavior: ricostruisce correttamente da una riga del database
    it("TU-F-browsing-36: fromDB() should ricostruisce correttamente da una riga del database", () => {
      const row: ProcessRow = {
        id: 55,
        documentClassId: 9,
        uuid: "proc-xyz",
        integrityStatus: "VALID",
      };
      const proc = Process.fromDB(row, meta);

      expect(proc.getId()).toBe(55);
      expect(proc.getDocumentClassId()).toBe(9);
      expect(proc.getUuid()).toBe("proc-xyz");
      expect(proc.getIntegrityStatus()).toBe(IntegrityStatusEnum.VALID);
      expect(proc.getMetadata()).toBe(meta);
    });

    // identifier: TU-F-browsing-37
    // method_name: fromDB()
    // description: should usa UNKNOWN se integrityStatus è assente nella riga
    // expected_value: matches asserted behavior: usa UNKNOWN se integrityStatus è assente nella riga
    it("TU-F-browsing-37: fromDB() should usa UNKNOWN se integrityStatus è assente nella riga", () => {
      const row: ProcessRow = { id: 1, documentClassId: 1, uuid: "x" };
      const proc = Process.fromDB(row, []);
      expect(proc.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
    });
  });

  describe("setIntegrityStatus", () => {
    // identifier: TU-F-browsing-38
    // method_name: setIntegrityStatus()
    // description: should aggiorna lo stato di integrità
    // expected_value: matches asserted behavior: aggiorna lo stato di integrità
    it("TU-F-browsing-38: setIntegrityStatus() should aggiorna lo stato di integrità", () => {
      const proc = new Process("dc-uuid", "uuid", []);
      proc.setIntegrityStatus(IntegrityStatusEnum.INVALID);
      expect(proc.getIntegrityStatus()).toBe(IntegrityStatusEnum.INVALID);
    });
  });
});
