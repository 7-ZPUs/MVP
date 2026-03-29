import { describe, expect, it } from "vitest";
import { Dip, DipRow } from "../../src/entity/Dip";
import { IntegrityStatusEnum } from "../../src/value-objects/IntegrityStatusEnum";

describe("Dip entity", () => {
  describe("constructor", () => {
    // identifier: TU-F-browsing-01
    // method_name: constructor
    // description: should assegna l'uuid passato
    // expected_value: returns the same uuid passed to the constructor
    it("TU-F-browsing-01: constructor should assegna l'uuid passato", () => {
      const dip = new Dip("abc-123");
      expect(dip.getUuid()).toBe("abc-123");
    });

    // identifier: TU-F-browsing-02
    // method_name: constructor
    // description: should imposta integrityStatus a UNKNOWN di default
    // expected_value: matches asserted behavior: imposta integrityStatus a UNKNOWN di default
    it("TU-F-browsing-02: constructor should imposta integrityStatus a UNKNOWN di default", () => {
      const dip = new Dip("abc-123");
      expect(dip.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
    });

    // identifier: TU-F-browsing-03
    // method_name: constructor
    // description: should id è null finché non viene salvato nel DB
    // expected_value: matches asserted behavior: id è null finché non viene salvato nel DB
    it("TU-F-browsing-03: constructor should id è null finché non viene salvato nel DB", () => {
      const dip = new Dip("abc-123");
      expect(dip.getId()).toBeNull();
    });
  });

  describe("fromDB", () => {
    // identifier: TU-F-browsing-04
    // method_name: fromDB()
    // description: should ricostruisce un Dip da una riga del database
    // expected_value: matches asserted behavior: ricostruisce un Dip da una riga del database
    it("TU-F-browsing-04: fromDB() should ricostruisce un Dip da una riga del database", () => {
      const row: DipRow = { id: 42, uuid: "xyz-999", integrityStatus: "VALID" };
      const dip = Dip.fromDB(row);

      expect(dip.getId()).toBe(42);
      expect(dip.getUuid()).toBe("xyz-999");
      expect(dip.getIntegrityStatus()).toBe(IntegrityStatusEnum.VALID);
    });
  });

  describe("setIntegrityStatus", () => {
    // identifier: TU-F-browsing-05
    // method_name: setIntegrityStatus()
    // description: should aggiorna lo stato di integrità
    // expected_value: matches asserted behavior: aggiorna lo stato di integrità
    it("TU-F-browsing-05: setIntegrityStatus() should aggiorna lo stato di integrità", () => {
      const dip = new Dip("abc-123");
      dip.setIntegrityStatus(IntegrityStatusEnum.VALID);
      expect(dip.getIntegrityStatus()).toBe(IntegrityStatusEnum.VALID);
    });
  });

  describe("toDTO", () => {
    // identifier: TU-F-browsing-06
    // method_name: toDTO()
    // description: should lancia un errore se id è null
    // expected_value: matches asserted behavior: lancia un errore se id è null
    it("TU-F-browsing-06: toDTO() should lancia un errore se id è null", () => {
      const dip = new Dip("abc-123");
      expect(() => dip.toDTO()).toThrow(
        "Cannot convert Dip to DTO: id is null",
      );
    });

    // identifier: TU-F-browsing-07
    // method_name: toDTO()
    // description: should restituisce il DTO corretto quando l'id è valorizzato
    // expected_value: returns DTO fields matching the Dip persisted values
    it("TU-F-browsing-07: toDTO() should restituisce il DTO corretto quando l'id è valorizzato", () => {
      const row: DipRow = {
        id: 1,
        uuid: "abc-123",
        integrityStatus: "INVALID",
      };
      const dip = Dip.fromDB(row);

      const dto = dip.toDTO();

      expect(dto.id).toBe(1);
      expect(dto.dipId).toBe(1);
      expect(dto.uuid).toBe("abc-123");
      expect(dto.integrityStatus).toBe(IntegrityStatusEnum.INVALID);
    });
  });
});
