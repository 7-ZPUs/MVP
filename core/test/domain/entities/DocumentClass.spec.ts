import { describe, expect, it } from "vitest";
import { DocumentClass, DocumentClassRow } from "../../../src/entity/DocumentClass";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";

describe("DocumentClass entity", () => {

    describe("constructor", () => {
        // identifier: TU-F-B-72
        // method_name: assegna()
        // description: assegna dipUuid, uuid, name e timestamp
        // expected_value: matches asserted behavior: assegna dipUuid, uuid, name e timestamp
        it("assegna dipUuid, uuid, name e timestamp", () => {
            const dc = new DocumentClass("dip-uuid", "dc-uuid", "Contratti", "2024-01-01T00:00:00Z");
            expect(dc.getDipUuid()).toBe("dip-uuid");
            expect(dc.getUuid()).toBe("dc-uuid");
            expect(dc.getName()).toBe("Contratti");
            expect(dc.getTimestamp()).toBe("2024-01-01T00:00:00Z");
        });

        // identifier: TU-F-B-73
        // method_name: imposta()
        // description: imposta integrityStatus a UNKNOWN di default
        // expected_value: matches asserted behavior: imposta integrityStatus a UNKNOWN di default
        it("imposta integrityStatus a UNKNOWN di default", () => {
            const dc = new DocumentClass("dip-uuid", "dc-uuid", "Fatture", "2024-01-01T00:00:00Z");
            expect(dc.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
        });

        // identifier: TU-F-B-74
        // method_name: id()
        // description: id è null finché non viene persistito
        // expected_value: matches asserted behavior: id è null finché non viene persistito
        it("id è null finché non viene persistito", () => {
            const dc = new DocumentClass("dip-uuid", "dc-uuid", "Fatture", "2024-01-01T00:00:00Z");
            expect(dc.getId()).toBeNull();
        });
    });

    describe("fromDB", () => {
        // identifier: TU-F-B-75
        // method_name: ricostruisce()
        // description: ricostruisce correttamente da una riga del database
        // expected_value: matches asserted behavior: ricostruisce correttamente da una riga del database
        it("ricostruisce correttamente da una riga del database", () => {
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

        // identifier: TU-F-B-76
        // method_name: usa()
        // description: usa UNKNOWN se integrityStatus è assente nella riga
        // expected_value: matches asserted behavior: usa UNKNOWN se integrityStatus è assente nella riga
        it("usa UNKNOWN se integrityStatus è assente nella riga", () => {
            const row: DocumentClassRow = {
                id: 1, dipId: 1, uuid: "x", name: "N", timestamp: "T",
            };
            const dc = DocumentClass.fromDB(row);
            expect(dc.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
        });
    });

    describe("setIntegrityStatus", () => {
        // identifier: TU-F-B-77
        // method_name: aggiorna()
        // description: aggiorna lo stato di integrità
        // expected_value: matches asserted behavior: aggiorna lo stato di integrità
        it("aggiorna lo stato di integrità", () => {
            const dc = new DocumentClass("dip-uuid", "uuid", "Nome", "2024-01-01T00:00:00Z");
            dc.setIntegrityStatus(IntegrityStatusEnum.INVALID);
            expect(dc.getIntegrityStatus()).toBe(IntegrityStatusEnum.INVALID);
        });
    });

    describe("toDTO", () => {
        // identifier: TU-F-B-78
        // method_name: lancia()
        // description: lancia un errore se id è null
        // expected_value: matches asserted behavior: lancia un errore se id è null
        it("lancia un errore se id è null", () => {
            const dc = new DocumentClass("dip-uuid", "uuid", "Nome", "2024-01-01T00:00:00Z");
            expect(() => dc.toDTO()).toThrow("Cannot convert to DTO: DocumentClass entity is not yet persisted and has no ID.");
        });

        // identifier: TU-F-B-79
        // method_name: restituisce()
        // description: restituisce il DTO corretto
        // expected_value: matches asserted behavior: restituisce il DTO corretto
        it("restituisce il DTO corretto", () => {
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
