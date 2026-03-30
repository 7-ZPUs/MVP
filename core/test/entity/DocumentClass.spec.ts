import { describe, expect, it } from "vitest";
import { DocumentClass, DocumentClassRow } from "../../src/entity/DocumentClass";
import { IntegrityStatusEnum } from "../../src/value-objects/IntegrityStatusEnum";

describe("DocumentClass entity", () => {

    describe("constructor", () => {
        // identifier: TU-F-browsing-16
        // method_name: assegna()
        // description: should assegna dipUuid, uuid, name e timestamp
        // expected_value: matches asserted behavior: assegna dipUuid, uuid, name e timestamp
        it("TU-F-browsing-16: assegna() should assegna dipUuid, uuid, name e timestamp", () => {
            const dc = new DocumentClass("dip-uuid", "dc-uuid", "Contratti", "2024-01-01T00:00:00Z");
            expect(dc.getDipUuid()).toBe("dip-uuid");
            expect(dc.getUuid()).toBe("dc-uuid");
            expect(dc.getName()).toBe("Contratti");
            expect(dc.getTimestamp()).toBe("2024-01-01T00:00:00Z");
        });

        // identifier: TU-F-browsing-17
        // method_name: imposta()
        // description: should imposta integrityStatus a UNKNOWN di default
        // expected_value: matches asserted behavior: imposta integrityStatus a UNKNOWN di default
        it("TU-F-browsing-17: imposta() should imposta integrityStatus a UNKNOWN di default", () => {
            const dc = new DocumentClass("dip-uuid", "dc-uuid", "Fatture", "2024-01-01T00:00:00Z");
            expect(dc.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
        });

        // identifier: TU-F-browsing-18
        // method_name: id()
        // description: should id è null finché non viene persistito
        // expected_value: matches asserted behavior: id è null finché non viene persistito
        it("TU-F-browsing-18: id() should id è null finché non viene persistito", () => {
            const dc = new DocumentClass("dip-uuid", "dc-uuid", "Fatture", "2024-01-01T00:00:00Z");
            expect(dc.getId()).toBeNull();
        });
    });

    describe("fromDB", () => {
        // identifier: TU-F-browsing-19
        // method_name: ricostruisce()
        // description: should ricostruisce correttamente da una riga del database
        // expected_value: matches asserted behavior: ricostruisce correttamente da una riga del database
        it("TU-F-browsing-19: ricostruisce() should ricostruisce correttamente da una riga del database", () => {
            const row: DocumentClassRow = {
                id: 99,
                dipId: 3,
                uuid: "dc-xyz",
                integrityStatus: "VALID",
                name: "Verbali",
                timestamp: "2024-06-15T10:00:00Z",
            };
            const dc = DocumentClass.fromDB(row);

            expect(dc.getId()).toBe(99);
            expect(dc.getDipId()).toBe(3);
            expect(dc.getUuid()).toBe("dc-xyz");
            expect(dc.getName()).toBe("Verbali");
            expect(dc.getTimestamp()).toBe("2024-06-15T10:00:00Z");
            expect(dc.getIntegrityStatus()).toBe(IntegrityStatusEnum.VALID);
        });

        // identifier: TU-F-browsing-20
        // method_name: usa()
        // description: should usa UNKNOWN se integrityStatus è assente nella riga
        // expected_value: matches asserted behavior: usa UNKNOWN se integrityStatus è assente nella riga
        it("TU-F-browsing-20: usa() should usa UNKNOWN se integrityStatus è assente nella riga", () => {
            const row: DocumentClassRow = {
                id: 1, dipId: 1, uuid: "x", name: "N", timestamp: "T",
            };
            const dc = DocumentClass.fromDB(row);
            expect(dc.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
        });
    });

    describe("setIntegrityStatus", () => {
        // identifier: TU-F-browsing-21
        // method_name: aggiorna()
        // description: should aggiorna lo stato di integrità
        // expected_value: matches asserted behavior: aggiorna lo stato di integrità
        it("TU-F-browsing-21: aggiorna() should aggiorna lo stato di integrità", () => {
            const dc = new DocumentClass("dip-uuid", "uuid", "Nome", "2024-01-01T00:00:00Z");
            dc.setIntegrityStatus(IntegrityStatusEnum.INVALID);
            expect(dc.getIntegrityStatus()).toBe(IntegrityStatusEnum.INVALID);
        });
    });

    describe("toDTO", () => {
        // identifier: TU-F-browsing-22
        // method_name: lancia()
        // description: should lancia un errore se id è null
        // expected_value: matches asserted behavior: lancia un errore se id è null
        it("TU-F-browsing-22: lancia() should lancia un errore se id è null", () => {
            const dc = new DocumentClass("dip-uuid", "uuid", "Nome", "2024-01-01T00:00:00Z");
            expect(() => dc.toDTO()).toThrow("Cannot convert to DTO: DocumentClass entity is not yet persisted and has no ID.");
        });

        // identifier: TU-F-browsing-23
        // method_name: restituisce()
        // description: should restituisce il DTO corretto
        // expected_value: matches asserted behavior: restituisce il DTO corretto
        it("TU-F-browsing-23: restituisce() should restituisce il DTO corretto", () => {
            const row: DocumentClassRow = {
                id: 7, dipId: 2, uuid: "dc-abc", name: "Ricevute",
                timestamp: "2025-03-01T08:00:00Z", integrityStatus: "VALID",
            };
            const dc = DocumentClass.fromDB(row);
            const dto = dc.toDTO();

            expect(dto.id).toBe(7);
            expect(dto.dipId).toBe(2);
            expect(dto.uuid).toBe("dc-abc");
            expect(dto.name).toBe("Ricevute");
            expect(dto.timestamp).toBe("2025-03-01T08:00:00Z");
            expect(dto.integrityStatus).toBe(IntegrityStatusEnum.VALID);
        });
    });
});
