import { describe, expect, it } from "vitest";
import { Dip, DipRow } from "../../../src/entity/Dip";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";

describe("Dip entity", () => {

    describe("constructor", () => {
        it("assegna l'uuid passato", () => {
            const dip = new Dip("abc-123");
            expect(dip.getUuid()).toBe("abc-123");
        });

        it("imposta integrityStatus a UNKNOWN di default", () => {
            const dip = new Dip("abc-123");
            expect(dip.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
        });

        it("id è null finché non viene salvato nel DB", () => {
            const dip = new Dip("abc-123");
            expect(dip.getId()).toBeNull();
        });
    });

    describe("fromDB", () => {
        it("ricostruisce un Dip da una riga del database", () => {
            const row: DipRow = { id: 42, uuid: "xyz-999", integrityStatus: "VALID" };
            const dip = Dip.fromDB(row);

            expect(dip.getId()).toBe(42);
            expect(dip.getUuid()).toBe("xyz-999");
            expect(dip.getIntegrityStatus()).toBe(IntegrityStatusEnum.VALID);
        });
    });

    describe("setIntegrityStatus", () => {
        it("aggiorna lo stato di integrità", () => {
            const dip = new Dip("abc-123");
            dip.setIntegrityStatus(IntegrityStatusEnum.VALID);
            expect(dip.getIntegrityStatus()).toBe(IntegrityStatusEnum.VALID);
        });
    });

    describe("toDTO", () => {
        it("lancia un errore se id è null", () => {
            const dip = new Dip("abc-123");
            expect(() => dip.toDTO()).toThrow("Cannot convert Dip to DTO: id is null");
        });

        it("restituisce il DTO corretto quando l'id è valorizzato", () => {
            const row: DipRow = { id: 1, uuid: "abc-123", integrityStatus: "INVALID" };
            const dip = Dip.fromDB(row);

            const dto = dip.toDTO();

            expect(dto.id).toBe(1);
            expect(dto.dipId).toBe(1);
            expect(dto.uuid).toBe("abc-123");
            expect(dto.integrityStatus).toBe(IntegrityStatusEnum.INVALID);
        });
    });
});
