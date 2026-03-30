import { describe, expect, it } from "vitest";
import { Process, ProcessRow } from "../../src/entity/Process";
import { IntegrityStatusEnum } from "../../src/value-objects/IntegrityStatusEnum";
import { Metadata, MetadataType } from "../../src/value-objects/Metadata";

const meta = [new Metadata("tipo", "verbale"), new Metadata("anno", "2025", MetadataType.NUMBER)];

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
            const proc = new Process("dc-uuid", "uuid", []);
            expect(proc.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
        });

        // identifier: TU-F-browsing-35
        // method_name: id()
        // description: should id è null finché non viene persistito
        // expected_value: matches asserted behavior: id è null finché non viene persistito
        it("TU-F-browsing-35: id() should id è null finché non viene persistito", () => {
            const proc = new Process("dc-uuid", "uuid", []);
            expect(proc.getId()).toBeNull();
        });
    });

    describe("fromDB", () => {
        // identifier: TU-F-browsing-36
        // method_name: ricostruisce()
        // description: should ricostruisce correttamente da una riga del database
        // expected_value: matches asserted behavior: ricostruisce correttamente da una riga del database
        it("TU-F-browsing-36: ricostruisce() should ricostruisce correttamente da una riga del database", () => {
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
        // method_name: usa()
        // description: should usa UNKNOWN se integrityStatus è assente nella riga
        // expected_value: matches asserted behavior: usa UNKNOWN se integrityStatus è assente nella riga
        it("TU-F-browsing-37: usa() should usa UNKNOWN se integrityStatus è assente nella riga", () => {
            const row: ProcessRow = { id: 1, documentClassId: 1, uuid: "x" };
            const proc = Process.fromDB(row, []);
            expect(proc.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
        });
    });

    describe("setIntegrityStatus", () => {
        // identifier: TU-F-browsing-38
        // method_name: aggiorna()
        // description: should aggiorna lo stato di integrità
        // expected_value: matches asserted behavior: aggiorna lo stato di integrità
        it("TU-F-browsing-38: aggiorna() should aggiorna lo stato di integrità", () => {
            const proc = new Process("dc-uuid", "uuid", []);
            proc.setIntegrityStatus(IntegrityStatusEnum.INVALID);
            expect(proc.getIntegrityStatus()).toBe(IntegrityStatusEnum.INVALID);
        });
    });

    describe("toDTO", () => {
        // identifier: TU-F-browsing-39
        // method_name: lancia()
        // description: should lancia un errore se id è null
        // expected_value: matches asserted behavior: lancia un errore se id è null
        it("TU-F-browsing-39: lancia() should lancia un errore se id è null", () => {
            const proc = new Process("dc-uuid", "uuid", []);
            expect(() => proc.toDTO()).toThrow("Cannot convert to DTO: Process entity is not yet persisted and has no ID.");
        });

        // identifier: TU-F-browsing-40
        // method_name: restituisce()
        // description: should restituisce il DTO corretto
        // expected_value: matches asserted behavior: restituisce il DTO corretto
        it("TU-F-browsing-40: restituisce() should restituisce il DTO corretto", () => {
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
