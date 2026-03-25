import { describe, expect, it } from "vitest";
import { File, FileRow } from "../../../src/entity/File";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";

describe("File entity", () => {

    describe("constructor", () => {
        it("assegna filename, path, isMain e documentUuid", () => {
            const file = new File("documento.xml", "/dip/subdir/documento.xml", "hash-doc", true, "doc-uuid");
            expect(file.getFilename()).toBe("documento.xml");
            expect(file.getPath()).toBe("/dip/subdir/documento.xml");
            expect(file.getIsMain()).toBe(true);
            expect(file.getDocumentUuid()).toBe("doc-uuid");
        });

        it("imposta integrityStatus a UNKNOWN di default", () => {
            const file = new File("f.xml", "/f.xml", "hash-default", false, "doc-uuid");
            expect(file.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
        });

        it("id è null finché non viene persistito", () => {
            const file = new File("f.xml", "/f.xml", "hash-default", false, "doc-uuid");
            expect(file.getId()).toBeNull();
        });

        it("isMain = false viene mantenuto", () => {
            const file = new File("allegato.pdf", "/allegato.pdf", "hash-allegato", false, "doc-uuid");
            expect(file.getIsMain()).toBe(false);
        });
    });

    describe("fromDB", () => {
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
        it("aggiorna lo stato di integrità", () => {
            const file = new File("f.xml", "/f.xml", "hash-default", true, "doc-uuid");
            file.setIntegrityStatus(IntegrityStatusEnum.INVALID);
            expect(file.getIntegrityStatus()).toBe(IntegrityStatusEnum.INVALID);
        });
    });

    describe("toDTO", () => {
        it("lancia un errore se id è null", () => {
            const file = new File("f.xml", "/f.xml", "hash-default", true, "doc-uuid");
            expect(() => file.toDTO()).toThrow("Cannot convert to DTO: File entity is not yet persisted and has no ID.");
        });

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
