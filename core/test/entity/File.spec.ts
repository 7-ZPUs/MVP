import { describe, expect, it } from "vitest";
import { File, FileRow } from "../../src/entity/File";
import { IntegrityStatusEnum } from "../../src/value-objects/IntegrityStatusEnum";

describe("File entity", () => {
  describe("constructor", () => {
    // identifier: TU-F-browsing-24
    // method_name: constructor
    // description: should assegna filename, path, isMain e documentUuid
    // expected_value: matches asserted behavior: assegna filename, path, isMain e documentUuid
    it("TU-F-browsing-24: constructor should assegna filename, path, isMain e documentUuid", () => {
      const file = new File(
        "documento.xml",
        "/dip/subdir/documento.xml",
        "hash-doc",
        true,
        "file-uuid",
        "doc-uuid",
      );
      expect(file.getFilename()).toBe("documento.xml");
      expect(file.getPath()).toBe("/dip/subdir/documento.xml");
      expect(file.getIsMain()).toBe(true);
      expect(file.getDocumentUuid()).toBe("doc-uuid");
    });

    // identifier: TU-F-browsing-25
    // method_name: constructor
    // description: should imposta integrityStatus a UNKNOWN di default
    // expected_value: matches asserted behavior: imposta integrityStatus a UNKNOWN di default
    it("TU-F-browsing-25: constructor should imposta integrityStatus a UNKNOWN di default", () => {
      const file = new File(
        "f.xml",
        "/f.xml",
        "hash-default",
        false,
        "file-uuid",
        "doc-uuid",
      );
      expect(file.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
    });

    // identifier: TU-F-browsing-26
    // method_name: constructor
    // description: should id è null finché non viene persistito
    // expected_value: matches asserted behavior: id è null finché non viene persistito
    it("TU-F-browsing-26: constructor should id è null finché non viene persistito", () => {
      const file = new File(
        "f.xml",
        "/f.xml",
        "hash-default",
        false,
        "file-uuid",
        "doc-uuid",
      );
      expect(file.getId()).toBeNull();
    });

    // identifier: TU-F-browsing-27
    // method_name: constructor
    // description: should isMain = false viene mantenuto
    // expected_value: matches asserted behavior: isMain = false viene mantenuto
    it("TU-F-browsing-27: constructor should isMain = false viene mantenuto", () => {
      const file = new File(
        "allegato.pdf",
        "/allegato.pdf",
        "hash-allegato",
        false,
        "file-uuid",
        "doc-uuid",
      );
      expect(file.getIsMain()).toBe(false);
    });
  });

  describe("fromDB", () => {
    // identifier: TU-F-browsing-28
    // method_name: fromDB()
    // description: should ricostruisce correttamente da una riga del database (isMain = 1)
    // expected_value: matches asserted behavior: ricostruisce correttamente da una riga del database (isMain = 1)
    it("TU-F-browsing-28: fromDB() should ricostruisce correttamente da una riga del database (isMain = 1)", () => {
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

    // identifier: TU-F-browsing-29
    // method_name: fromDB()
    // description: should converte isMain = 0 in false
    // expected_value: matches asserted behavior: converte isMain = 0 in false
    it("TU-F-browsing-29: fromDB() should converte isMain = 0 in false", () => {
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
    // identifier: TU-F-browsing-30
    // method_name: setIntegrityStatus()
    // description: should aggiorna lo stato di integrità
    // expected_value: matches asserted behavior: aggiorna lo stato di integrità
    it("TU-F-browsing-30: setIntegrityStatus() should aggiorna lo stato di integrità", () => {
      const file = new File(
        "f.xml",
        "/f.xml",
        "hash-default",
        true,
        "file-uuid",
        "doc-uuid",
      );
      file.setIntegrityStatus(IntegrityStatusEnum.INVALID);
      expect(file.getIntegrityStatus()).toBe(IntegrityStatusEnum.INVALID);
    });
  });
});
