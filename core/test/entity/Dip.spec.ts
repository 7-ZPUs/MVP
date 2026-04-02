import { describe, expect, it } from "vitest";
import { Dip, DipRow } from "../../src/entity/Dip";
import { IntegrityStatusEnum } from "../../src/value-objects/IntegrityStatusEnum";

describe("Dip entity", () => {
  describe("constructor", () => {
    // identifier: TU-F-browsing-01
    // method_name: getUuid()
    // description: should assegna l'uuid passato
    // expected_value: returns the same uuid passed to the constructor
    it("TU-F-browsing-01: getUuid() should assegna l'uuid passato", () => {
      const dip = new Dip("abc-123");
      expect(dip.getUuid()).toBe("abc-123");
    });

    // identifier: TU-F-browsing-02
    // method_name: imposta()
    // description: should imposta integrityStatus a UNKNOWN di default
    // expected_value: matches asserted behavior: imposta integrityStatus a UNKNOWN di default
    it("TU-F-browsing-02: imposta() should imposta integrityStatus a UNKNOWN di default", () => {
      const dip = new Dip("abc-123");
      expect(dip.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
    });

    // identifier: TU-F-browsing-03
    // method_name: id()
    // description: should id è null finché non viene salvato nel DB
    // expected_value: matches asserted behavior: id è null finché non viene salvato nel DB
    it("TU-F-browsing-03: id() should id è null finché non viene salvato nel DB", () => {
      const dip = new Dip("abc-123");
      expect(dip.getId()).toBeNull();
    });
  });

  describe("setIntegrityStatus", () => {
    // identifier: TU-F-browsing-05
    // method_name: aggiorna()
    // description: should aggiorna lo stato di integrità
    // expected_value: matches asserted behavior: aggiorna lo stato di integrità
    it("TU-F-browsing-05: aggiorna() should aggiorna lo stato di integrità", () => {
      const dip = new Dip("abc-123");
      dip.setIntegrityStatus(IntegrityStatusEnum.VALID);
      expect(dip.getIntegrityStatus()).toBe(IntegrityStatusEnum.VALID);
    });
  });
});
