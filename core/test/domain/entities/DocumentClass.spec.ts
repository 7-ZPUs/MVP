import { DocumentClass, DocumentClassRow } from "../../../src/entity/DocumentClass";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";

describe("DocumentClass entity", () => {

    describe("constructor", () => {
        it("assegna dipId, uuid, name e timestamp", () => {
            const dc = new DocumentClass(1, "dc-uuid", "Contratti", "2024-01-01T00:00:00Z");
            expect(dc.getProcessId()).toBe(1);
            expect(dc.getUuid()).toBe("dc-uuid");
            expect(dc.getName()).toBe("Contratti");
            expect(dc.getTimestamp()).toBe("2024-01-01T00:00:00Z");
        });

        it("imposta integrityStatus a UNKNOWN di default", () => {
            const dc = new DocumentClass(1, "dc-uuid", "Fatture", "2024-01-01T00:00:00Z");
            expect(dc.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
        });

        it("id è null finché non viene persistito", () => {
            const dc = new DocumentClass(1, "dc-uuid", "Fatture", "2024-01-01T00:00:00Z");
            expect(dc.getId()).toBeNull();
        });
    });

    describe("fromDB", () => {
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
            expect(dc.getProcessId()).toBe(3);
            expect(dc.getUuid()).toBe("dc-xyz");
            expect(dc.getName()).toBe("Verbali");
            expect(dc.getTimestamp()).toBe("2024-06-15T10:00:00Z");
            expect(dc.getIntegrityStatus()).toBe(IntegrityStatusEnum.VALID);
        });

        it("usa UNKNOWN se integrityStatus è assente nella riga", () => {
            const row: DocumentClassRow = {
                id: 1, dipId: 1, uuid: "x", name: "N", timestamp: "T",
            };
            const dc = DocumentClass.fromDB(row);
            expect(dc.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
        });
    });

    describe("setIntegrityStatus", () => {
        it("aggiorna lo stato di integrità", () => {
            const dc = new DocumentClass(1, "uuid", "Nome", "2024-01-01T00:00:00Z");
            dc.setIntegrityStatus(IntegrityStatusEnum.INVALID);
            expect(dc.getIntegrityStatus()).toBe(IntegrityStatusEnum.INVALID);
        });
    });

    describe("toDTO", () => {
        it("lancia un errore se id è null", () => {
            const dc = new DocumentClass(1, "uuid", "Nome", "2024-01-01T00:00:00Z");
            expect(() => dc.toDTO()).toThrow("Cannot convert to DTO: DocumentClass entity is not yet persisted and has no ID.");
        });

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
