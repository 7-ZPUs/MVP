import { Process, ProcessRow } from "../../../src/entity/Process";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";
import { Metadata } from "../../../src/value-objects/Metadata";

const meta = [new Metadata("tipo", "verbale"), new Metadata("anno", "2025", "number")];

describe("Process entity", () => {

    describe("constructor", () => {
        it("assegna documentClassId, uuid e metadata", () => {
            const proc = new Process(5, "proc-uuid", meta);
            expect(proc.getDocumentClassId()).toBe(5);
            expect(proc.getUuid()).toBe("proc-uuid");
            expect(proc.getMetadata()).toBe(meta);
        });

        it("imposta integrityStatus a UNKNOWN di default", () => {
            const proc = new Process(1, "uuid", []);
            expect(proc.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
        });

        it("id è null finché non viene persistito", () => {
            const proc = new Process(1, "uuid", []);
            expect(proc.getId()).toBeNull();
        });
    });

    describe("fromDB", () => {
        it("ricostruisce correttamente da una riga del database", () => {
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

        it("usa UNKNOWN se integrityStatus è assente nella riga", () => {
            const row: ProcessRow = { id: 1, documentClassId: 1, uuid: "x" };
            const proc = Process.fromDB(row, []);
            expect(proc.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
        });
    });

    describe("setIntegrityStatus", () => {
        it("aggiorna lo stato di integrità", () => {
            const proc = new Process(1, "uuid", []);
            proc.setIntegrityStatus(IntegrityStatusEnum.INVALID);
            expect(proc.getIntegrityStatus()).toBe(IntegrityStatusEnum.INVALID);
        });
    });

    describe("toDTO", () => {
        it("lancia un errore se id è null", () => {
            const proc = new Process(1, "uuid", []);
            expect(() => proc.toDTO()).toThrow("Cannot convert to DTO: Process entity is not yet persisted and has no ID.");
        });

        it("restituisce il DTO corretto", () => {
            const row: ProcessRow = {
                id: 3, documentClassId: 2, uuid: "proc-abc", integrityStatus: "VALID",
            };
            const proc = Process.fromDB(row, meta);
            const dto = proc.toDTO();

            expect(dto.id).toBe(3);
            expect(dto.documentClassId).toBe(2);
            expect(dto.uuid).toBe("proc-abc");
            expect(dto.integrityStatus).toBe(IntegrityStatusEnum.VALID);
            expect(dto.metadata).toHaveLength(2);
            expect(dto.metadata[0].name).toBe("tipo");
            expect(dto.metadata[1].name).toBe("anno");
        });
    });
});
