import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { XmlDipParser } from "../../../src/repo/impl/utils/XmlDipParser";

describe("ParserTests", () => {
  it("parseDipIndex() with valid XML input", () => {
    const xmlContent = readFileSync(
      "core/test/resources/dipindex_example.xml",
      "utf-8",
    );
    const parser = new XmlDipParser();
    const result = parser.parseDipIndex(xmlContent);

    expect(result.PackageInfo.ProcessUUID).toBe(
      "ec276d29-f80c-4693-b3c9-1cb650e23114",
    );

    const documentClasses = result.PackageContent.DiPDocuments.DocumentClass;
    expect(documentClasses.length).toBe(2);

    // First DocumentClass
    const aips1 = documentClasses[0].AiP;
    expect(aips1.length).toBe(3);

    const doc1_0 = aips1[0].Document;
    expect(doc1_0.length).toBe(1);
    expect(doc1_0[0].Files["@_FilesCount"]).toBe("2");
    expect(doc1_0[0].Files.Metadata).toBeDefined();
    expect(doc1_0[0].Files.Primary).toBeDefined();

    const doc1_1 = aips1[1].Document;
    expect(doc1_1.length).toBe(1);
    expect(doc1_1[0].Files["@_FilesCount"]).toBe("8");
    expect(doc1_1[0].Files.Metadata).toBeDefined();
    expect(doc1_1[0].Files.Primary).toBeDefined();
    expect(doc1_1[0].Files.Attachments?.length).toBe(6);

    const doc1_2 = aips1[2].Document;
    expect(doc1_2.length).toBe(1);
    expect(doc1_2[0].Files["@_FilesCount"]).toBe("3");
    expect(doc1_2[0].Files.Metadata).toBeDefined();
    expect(doc1_2[0].Files.Primary).toBeDefined();
    expect(doc1_2[0].Files.Attachments?.length).toBe(1);

    // Second DocumentClass
    const aips2 = documentClasses[1].AiP;
    expect(aips2.length).toBe(4);

    const doc2_0 = aips2[0].Document;
    expect(doc2_0.length).toBe(1);
    expect(doc2_0[0].Files["@_FilesCount"]).toBe("8");
    expect(doc2_0[0].Files.Metadata).toBeDefined();
    expect(doc2_0[0].Files.Primary).toBeDefined();
    expect(doc2_0[0].Files.Attachments?.length).toBe(6);

    const doc2_1 = aips2[1].Document;
    expect(doc2_1.length).toBe(1);
    expect(doc2_1[0].Files["@_FilesCount"]).toBe("5");
    expect(doc2_1[0].Files.Metadata).toBeDefined();
    expect(doc2_1[0].Files.Primary).toBeDefined();
    expect(doc2_1[0].Files.Attachments?.length).toBe(3);

    const doc2_2 = aips2[2].Document;
    expect(doc2_2.length).toBe(1);
    expect(doc2_2[0].Files["@_FilesCount"]).toBe("5");
    expect(doc2_2[0].Files.Metadata).toBeDefined();
    expect(doc2_2[0].Files.Primary).toBeDefined();
    expect(doc2_2[0].Files.Attachments?.length).toBe(3);

    const doc2_3 = aips2[3].Document;
    expect(doc2_3.length).toBe(1);
    expect(doc2_3[0].Files["@_FilesCount"]).toBe("2");
    expect(doc2_3[0].Files.Metadata).toBeDefined();
    expect(doc2_3[0].Files.Primary).toBeDefined();

    // Signature
    expect(result).toBeDefined();
  });

  it("parseDipIndex() with invalid XML input should throw", () => {
    const invalidXml = "<Invalid></Invalid>";
    const parser = new XmlDipParser();
    expect(() => parser.parseDipIndex(invalidXml)).toThrow(
      "Invalid DiPIndex XML: missing root element 'DiPIndex'",
    );
  });

  it("parseMetadata() with valid XML input", () => {
    const xmlContent = readFileSync(
      "core/test/resources/metadata_di_example.xml",
      "utf-8",
    );
    const parser = new XmlDipParser();
    const result = parser.parseDocumentMetadata(xmlContent);

    expect(result.length).toBe(15);
    expect(result[0].name).toBe("CategoriaProdotto");
    expect(result[0].value).toBe("Bagno");
    expect(result[0].type).toBe("string");

    expect(result[1].name).toBe("ModalitaPagamento");
    expect(result[1].value).toBe("Bonifico");
    expect(result[1].type).toBe("string");

    expect(result[2].name).toBe("NumeroFattura");
    expect(result[2].value).toBe("FT-2025-1973");
    expect(result[2].type).toBe("string");

    expect(result[3].name).toBe("DataFattura");
    expect(result[3].value).toBe("2025-10-11");
    expect(result[3].type).toBe("string");
  });

  it("parseMetadata() with invalid XML input should throw", () => {
    const invalidXml = "<Invalid></Invalid>";
    const parser = new XmlDipParser();
    expect(() => parser.parseDocumentMetadata(invalidXml)).toThrow(
      "Invalid metadata XML: missing expected root element",
    );
  });
});
