import { describe, expect, it } from "vitest";
import { Dip, DipRow } from "../../../src/entity/Dip";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";

describe("Dip entity", () => {
  describe("constructor", () => {
    // identifier: TU-F-B-111
    // method_name: getUuid()
    // description: assegna l'uuid passato
    // expected_value: returns the same uuid passed to the constructor
    it("assegna l'uuid passato", () => {
      const dip = new Dip("abc-123");
      expect(dip.getUuid()).toBe("abc-123");
    });

    // identifier: TU-F-B-59
    // method_name: imposta()
    // description: imposta integrityStatus a UNKNOWN di default
    // expected_value: matches asserted behavior: imposta integrityStatus a UNKNOWN di default
    it("imposta integrityStatus a UNKNOWN di default", () => {
      const dip = new Dip("abc-123");
      expect(dip.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
    });

    // identifier: TU-F-B-60
    // method_name: id()
    // description: id è null finché non viene salvato nel DB
    // expected_value: matches asserted behavior: id è null finché non viene salvato nel DB
    it("id è null finché non viene salvato nel DB", () => {
      const dip = new Dip("abc-123");
      expect(dip.getId()).toBeNull();
    });
  });

  describe("fromDB", () => {
    // identifier: TU-F-B-61
    // method_name: ricostruisce()
    // description: ricostruisce un Dip da una riga del database
    // expected_value: matches asserted behavior: ricostruisce un Dip da una riga del database
    it("ricostruisce un Dip da una riga del database", () => {
      const row: DipRow = { id: 42, uuid: "xyz-999", integrityStatus: "VALID" };
      const dip = Dip.fromDB(row);

      expect(dip.getId()).toBe(42);
      expect(dip.getUuid()).toBe("xyz-999");
      expect(dip.getIntegrityStatus()).toBe(IntegrityStatusEnum.VALID);
    });
  });

  describe("setIntegrityStatus", () => {
    // identifier: TU-F-B-62
    // method_name: aggiorna()
    // description: aggiorna lo stato di integrità
    // expected_value: matches asserted behavior: aggiorna lo stato di integrità
    it("aggiorna lo stato di integrità", () => {
      const dip = new Dip("abc-123");
      dip.setIntegrityStatus(IntegrityStatusEnum.VALID);
      expect(dip.getIntegrityStatus()).toBe(IntegrityStatusEnum.VALID);
    });
  });

  describe("toDTO", () => {
    // identifier: TU-F-B-63
    // method_name: lancia()
    // description: lancia un errore se id è null
    // expected_value: matches asserted behavior: lancia un errore se id è null
    it("lancia un errore se id è null", () => {
      const dip = new Dip("abc-123");
      expect(() => dip.toDTO()).toThrow(
        "Cannot convert Dip to DTO: id is null",
      );
    });

    // identifier: TU-F-B-112
    // method_name: toDTO()
    // description: restituisce il DTO corretto quando l'id è valorizzato
    // expected_value: returns DTO fields matching the Dip persisted values
    it("restituisce il DTO corretto quando l'id è valorizzato", () => {
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
