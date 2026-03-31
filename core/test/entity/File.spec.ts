import { describe, expect, it } from "vitest";
import { File } from "../../src/entity/File";
import { IntegrityStatusEnum } from "../../src/value-objects/IntegrityStatusEnum";

describe("File entity", () => {

    describe("constructor", () => {
        // identifier: TU-F-browsing-24
        // method_name: assegna()
        // description: should assegna filename, path, isMain e documentUuid
        // expected_value: matches asserted behavior: assegna filename, path, isMain e documentUuid
        it("TU-F-browsing-24: assegna() should assegna filename, path, isMain, uuid e documentUuid", () => {
            const file = new File("documento.xml", "/dip/subdir/documento.xml", "hash-doc", true, "uuid", "doc-uuid", IntegrityStatusEnum.VALID);
        it("TU-F-browsing-24: assegna() should assegna filename, path, isMain, uuid e documentUuid", () => {
            const file = new File("documento.xml", "/dip/subdir/documento.xml", "hash-doc", true, "uuid", "doc-uuid", IntegrityStatusEnum.VALID);
            expect(file.getFilename()).toBe("documento.xml");
            expect(file.getPath()).toBe("/dip/subdir/documento.xml");
            expect(file.getIsMain()).toBe(true);
            expect(file.getDocumentUuid()).toBe("doc-uuid");
            expect(file.getUuid()).toBe("uuid");
        });

        // identifier: TU-F-browsing-25
        // method_name: imposta()
        // description: should imposta integrityStatus a UNKNOWN di default
        // expected_value: matches asserted behavior: imposta integrityStatus a UNKNOWN di default
        it("TU-F-browsing-25: imposta() should imposta integrityStatus a UNKNOWN di default", () => {
            const file = new File("f.xml", "/f.xml", "hash-default", false, "uuid", "doc-uuid", IntegrityStatusEnum.UNKNOWN);
            const file = new File("f.xml", "/f.xml", "hash-default", false, "uuid", "doc-uuid", IntegrityStatusEnum.UNKNOWN);
            expect(file.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
        });

        // identifier: TU-F-browsing-26
        // method_name: id()
        // description: should id è null finché non viene persistito
        // expected_value: matches asserted behavior: id è null finché non viene persistito
        it("TU-F-browsing-26: id() should id è null finché non viene persistito", () => {
            const file = new File("f.xml", "/f.xml", "hash-default", false, "uuid", "doc-uuid", IntegrityStatusEnum.UNKNOWN);
            const file = new File("f.xml", "/f.xml", "hash-default", false, "uuid", "doc-uuid", IntegrityStatusEnum.UNKNOWN);
            expect(file.getId()).toBeNull();
        });

        // identifier: TU-F-browsing-27
        // method_name: isMain()
        // description: should isMain = false viene mantenuto
        // expected_value: matches asserted behavior: isMain = false viene mantenuto
        it("TU-F-browsing-27: isMain() should isMain = false viene mantenuto", () => {
            const file = new File("allegato.pdf", "/allegato.pdf", "hash-allegato", false, "uuid", "doc-uuid", IntegrityStatusEnum.UNKNOWN);
            const file = new File("allegato.pdf", "/allegato.pdf", "hash-allegato", false, "uuid", "doc-uuid", IntegrityStatusEnum.UNKNOWN);
            expect(file.getIsMain()).toBe(false);
        });
    });

   

    describe("setIntegrityStatus", () => {
        // identifier: TU-F-browsing-30
        // method_name: aggiorna()
        // description: should aggiorna lo stato di integrità
        // expected_value: matches asserted behavior: aggiorna lo stato di integrità
        it("TU-F-browsing-30: aggiorna() should aggiorna lo stato di integrità", () => {
            const file = new File("f.xml", "/f.xml", "hash-default", true, "doc-uuid");
            file.setIntegrityStatus(IntegrityStatusEnum.INVALID);
            expect(file.getIntegrityStatus()).toBe(IntegrityStatusEnum.INVALID);
        });
    });

});
