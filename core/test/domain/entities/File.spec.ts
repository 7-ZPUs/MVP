import { describe, expect, it } from "vitest";
import { File, FileRow } from "../../../src/entity/File";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";

describe("File entity", () => {

    describe("constructor", () => {
        // identifier: TU-F-B-80
        // method_name: assegna()
        // description: assegna filename, path, isMain e documentUuid
        // expected_value: matches asserted behavior: assegna filename, path, isMain e documentUuid
        it("assegna filename, path, isMain e documentUuid", () => {
            const file = new File("documento.xml", "/dip/subdir/documento.xml", "hash-doc", true, "doc-uuid");
            expect(file.getFilename()).toBe("documento.xml");
            expect(file.getPath()).toBe("/dip/subdir/documento.xml");
            expect(file.getIsMain()).toBe(true);
            expect(file.getDocumentUuid()).toBe("doc-uuid");
        });

        // identifier: TU-F-B-81
        // method_name: imposta()
        // description: imposta integrityStatus a UNKNOWN di default
        // expected_value: matches asserted behavior: imposta integrityStatus a UNKNOWN di default
        it("imposta integrityStatus a UNKNOWN di default", () => {
            const file = new File("f.xml", "/f.xml", "hash-default", false, "doc-uuid");
            expect(file.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
        });

        // identifier: TU-F-B-82
        // method_name: id()
        // description: id è null finché non viene persistito
        // expected_value: matches asserted behavior: id è null finché non viene persistito
        it("id è null finché non viene persistito", () => {
            const file = new File("f.xml", "/f.xml", "hash-default", false, "doc-uuid");
            expect(file.getId()).toBeNull();
        });

        // identifier: TU-F-B-83
        // method_name: isMain()
        // description: isMain = false viene mantenuto
        // expected_value: matches asserted behavior: isMain = false viene mantenuto
        it("isMain = false viene mantenuto", () => {
            const file = new File("allegato.pdf", "/allegato.pdf", "hash-allegato", false, "doc-uuid");
            expect(file.getIsMain()).toBe(false);
        });
    });

    describe("fromDB", () => {
        // identifier: TU-F-B-84
        // method_name: ricostruisce()
        // description: ricostruisce correttamente da una riga del database (isMain = 1)
        // expected_value: matches asserted behavior: ricostruisce correttamente da una riga del database (isMain = 1)
        it("ricostruisce correttamente da una riga del database (isMain = 1)", () => {
            const row: FileRow = {
                id: 20,
                filename: "main.xml",
                path: "/pkg/main.xml",
                hash: "hash-main",
                integrityStatus: "VALID",
                isMain: 1,
                documentId: 8,
            };
            const file = File.fromDB(row);

            expect(file.getId()).toBe(20);
            expect(file.getFilename()).toBe("main.xml");
            expect(file.getPath()).toBe("/pkg/main.xml");
            expect(file.getIntegrityStatus()).toBe(IntegrityStatusEnum.VALID);
            expect(file.getIsMain()).toBe(true);
            expect(file.getDocumentId()).toBe(8);
        });

        // identifier: TU-F-B-85
        // method_name: converte()
        // description: converte isMain = 0 in false
        // expected_value: matches asserted behavior: converte isMain = 0 in false
        it("converte isMain = 0 in false", () => {
            const row: FileRow = {
                id: 21,
                filename: "allegato.pdf",
                path: "/pkg/allegato.pdf",
                hash: "hash-allegato",
                integrityStatus: "UNKNOWN",
                isMain: 0,
                documentId: 8,
            };
            expect(File.fromDB(row).getIsMain()).toBe(false);
        });
    });

    describe("setIntegrityStatus", () => {
        // identifier: TU-F-B-86
        // method_name: aggiorna()
        // description: aggiorna lo stato di integrità
        // expected_value: matches asserted behavior: aggiorna lo stato di integrità
        it("aggiorna lo stato di integrità", () => {
            const file = new File("f.xml", "/f.xml", "hash-default", true, "doc-uuid");
            file.setIntegrityStatus(IntegrityStatusEnum.INVALID);
            expect(file.getIntegrityStatus()).toBe(IntegrityStatusEnum.INVALID);
        });
    });

    describe("toDTO", () => {
        // identifier: TU-F-B-87
        // method_name: lancia()
        // description: lancia un errore se id è null
        // expected_value: matches asserted behavior: lancia un errore se id è null
        it("lancia un errore se id è null", () => {
            const file = new File("f.xml", "/f.xml", "hash-default", true, "doc-uuid");
            expect(() => file.toDTO()).toThrow("Cannot convert to DTO: File entity is not yet persisted and has no ID.");
        });

        // identifier: TU-F-B-88
        // method_name: restituisce()
        // description: restituisce il DTO corretto
        // expected_value: matches asserted behavior: restituisce il DTO corretto
        it("restituisce il DTO corretto", () => {
            const row: FileRow = {
                id: 5, filename: "doc.xml", path: "/doc.xml", hash: "hash-doc",
                integrityStatus: "INVALID", isMain: 1, documentId: 3,
            };
            const file = File.fromDB(row);
            const dto = file.toDTO();

            expect(dto.id).toBe(5);
            expect(dto.filename).toBe("doc.xml");
            expect(dto.path).toBe("/doc.xml");
            expect(dto.integrityStatus).toBe(IntegrityStatusEnum.INVALID);
            expect(dto.isMain).toBe(true);
            expect(dto.documentId).toBe(3);
        });
    });
});
