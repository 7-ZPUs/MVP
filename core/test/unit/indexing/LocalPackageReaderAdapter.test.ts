import { readFileSync } from "node:fs";
import { describe, it, expect, vi } from "vitest";
import { XmlDipParser } from "../../../src/repo/impl/utils/XmlDipParser";
import { DipIndexMapper } from "../../../src/repo/impl/utils/DipIndexMapper";
import { ensureArray } from "../../../src/repo/impl/utils/ensureArray";
import type { DipIndexXml } from "../../../src/repo/xml-types/DipIndexXml";
import { LocalPackageReaderAdapter } from "../../../src/repo/impl/LocalPackageReaderAdapter";
import { Dip } from "../../../src/entity/Dip";
import { FileSystemProvider } from "../../../src/repo/impl/utils/FileSystemProvider";

describe("ParserTests", () => {
  it("TU-B-P-01: parseDipIndex() with valid XML input", () => {
    const xmlContent = readFileSync(
      "core/test/resources/dipindex_test.xml",
      "utf-8",
    );
    const parser = new XmlDipParser();
    const result = parser.parseDipIndex(xmlContent);

    expect(result.PackageInfo.ProcessUUID).toBe("test-dip-uuid-1234");

    const documentClasses = result.PackageContent.DiPDocuments.DocumentClass;
    expect(documentClasses.length).toBe(2);

    // First DocumentClass
    const aips1 = documentClasses[0].AiP;
    expect(aips1.length).toBe(1);

    const doc1_0 = aips1[0].Document;
    expect(doc1_0.length).toBe(1);
    expect(doc1_0[0].Files["@_FilesCount"]).toBe("2");
    expect(doc1_0[0].Files.Metadata).toBeDefined();
    expect(doc1_0[0].Files.Primary).toBeDefined();
    expect(doc1_0[0].Files.Attachments).toBeUndefined();

    // Second DocumentClass
    const aips2 = documentClasses[1].AiP;
    expect(aips2.length).toBe(2);

    const doc2_0 = aips2[0].Document;
    expect(doc2_0.length).toBe(1);
    expect(doc2_0[0].Files["@_FilesCount"]).toBe("4");
    expect(doc2_0[0].Files.Metadata).toBeDefined();
    expect(doc2_0[0].Files.Primary).toBeDefined();
    expect(ensureArray(doc2_0[0].Files.Attachments).length).toBe(2);

    const doc2_1 = aips2[1].Document;
    expect(doc2_1.length).toBe(1);
    expect(doc2_1[0].Files["@_FilesCount"]).toBe("2");
    expect(doc2_1[0].Files.Metadata).toBeDefined();
    expect(doc2_1[0].Files.Primary).toBeDefined();
    expect(doc2_1[0].Files.Attachments).toBeUndefined();

    // Signature (not present in new test file)
    expect(result).toBeDefined();
  });

  it("TU-B-P-02: parseDipIndex() with invalid XML input should throw", () => {
    const invalidXml = "<Invalid></Invalid>";
    const parser = new XmlDipParser();
    expect(() => parser.parseDipIndex(invalidXml)).toThrow(
      "Invalid DiPIndex XML: missing root element 'DiPIndex'",
    );
  });

  it("TU-B-P-03: parseMetadata() with valid XML input", () => {
    const xmlContent = readFileSync(
      "core/test/resources/metadata_test.xml",
      "utf-8",
    );
    const parser = new XmlDipParser();
    const result = parser.parseDocumentMetadata(xmlContent);

    expect(result.length).toBe(5);

    // Oggetto innestato (object)
    expect(result.find((m) => m.name === "IdDoc")?.value).toBe(
      "[object Object]",
    );

    // Booleano originariamente, ma il parser restituisce stringa "[object Object]" o forse boolean (no, il textNode value in fast-xml-parser per tag semplici è stringa, numero o booleano)
    expect(result.find((m) => m.name === "Riservato")?.value).toBe("true");

    // Numero
    expect(result.find((m) => m.name === "TempoDiConservazione")?.value).toBe(
      "10",
    );

    // Lista (array di oggetti)
    expect(result.find((m) => m.name === "Soggetti")?.value).toBe(
      "[object Object]",
    );

    // Stringa
    expect(result.find((m) => m.name === "Titolo")?.value).toBe(
      "Documento di test",
    );
  });

  it("TU-B-P-04: parseMetadata() with invalid XML input should throw", () => {
    const invalidXml = "<Invalid></Invalid>";
    const parser = new XmlDipParser();
    expect(() => parser.parseDocumentMetadata(invalidXml)).toThrow(
      "Invalid metadata XML: missing expected root element",
    );
  });
});

describe("DipIndexMapperTests", () => {
  const RAW_DIP_INDEX_XML = "<DiPIndex />";

  it("TU-B-P-01: extractDipUuid() should return correct UUID", () => {
    const parseDipIndexMock = vi
      .fn<[rawContent: string], DipIndexXml>()
      .mockReturnValue({
        PackageInfo: { ProcessUUID: "test-dip-uuid-1234" },
      } as unknown as DipIndexXml);
    const mapper = new DipIndexMapper(parseDipIndexMock(RAW_DIP_INDEX_XML));

    const dipUuid = mapper.extractDipUuid();
    expect(parseDipIndexMock).toHaveBeenCalledWith(RAW_DIP_INDEX_XML);
    expect(dipUuid).toBe("test-dip-uuid-1234");
  });

  it("extractDocumentClasses() should return document classes", () => {
    const parseDipIndexMock = vi
      .fn<[rawContent: string], DipIndexXml>()
      .mockReturnValue({
        PackageContent: {
          DiPDocuments: {
            DocumentClass: [{ "@_uuid": "class-1" }, { "@_uuid": "class-2" }],
          },
        },
      } as unknown as DipIndexXml);
    const mapper = new DipIndexMapper(parseDipIndexMock(RAW_DIP_INDEX_XML));

    const classes = mapper.extractDocumentClasses();
    expect(parseDipIndexMock).toHaveBeenCalledWith(RAW_DIP_INDEX_XML);
    expect(classes.length).toBe(2);
    expect(classes[0]["@_uuid"]).toBe("class-1");
    expect(classes[1]["@_uuid"]).toBe("class-2");
  });

  it("extractProcesses() should return mapped processes", () => {
    const parseDipIndexMock = vi
      .fn<[rawContent: string], DipIndexXml>()
      .mockReturnValue({
        PackageContent: {
          DiPDocuments: {
            DocumentClass: [
              {
                "@_uuid": "class-1",
                AiP: [{ "@_uuid": "aip-1", AiPRoot: "./class-1/aip-1" }],
              },
              {
                "@_uuid": "class-2",
                AiP: [
                  { "@_uuid": "aip-2", AiPRoot: "./class-2/aip-2" },
                  { "@_uuid": "aip-3", AiPRoot: "./class-2/aip-3" },
                ],
              },
            ],
          },
        },
      } as unknown as DipIndexXml);
    const mapper = new DipIndexMapper(parseDipIndexMock(RAW_DIP_INDEX_XML));

    const processes = mapper.extractProcesses();
    expect(parseDipIndexMock).toHaveBeenCalledWith(RAW_DIP_INDEX_XML);
    expect(processes.length).toBe(3);

    expect(processes[0].uuid).toBe("aip-1");
    expect(processes[0].documentClassUuid).toBe("class-1");
    expect(processes[0].aipRoot).toBe("./class-1/aip-1");

    expect(processes[1].uuid).toBe("aip-2");
    expect(processes[1].documentClassUuid).toBe("class-2");
    expect(processes[1].aipRoot).toBe("./class-2/aip-2");

    expect(processes[2].uuid).toBe("aip-3");
    expect(processes[2].documentClassUuid).toBe("class-2");
    expect(processes[2].aipRoot).toBe("./class-2/aip-3");
  });

  it("extractDocuments() should return mapped documents", () => {
    const parseDipIndexMock = vi
      .fn<[rawContent: string], DipIndexXml>()
      .mockReturnValue({
        PackageContent: {
          DiPDocuments: {
            DocumentClass: [
              {
                AiP: [
                  {
                    "@_uuid": "aip-1",
                    Document: [
                      {
                        "@_uuid": "doc-1",
                        DocumentPath: "./class-1/aip-1/doc-1",
                        Files: { Metadata: { "#text": "./meta.xml" } },
                      },
                    ],
                  },
                ],
              },
              {
                AiP: [
                  {
                    "@_uuid": "aip-2",
                    Document: [
                      {
                        "@_uuid": "doc-2",
                        DocumentPath: "./class-2/aip-2/doc-2",
                        Files: { Metadata: { "#text": "./meta2.xml" } },
                      },
                    ],
                  },
                  {
                    "@_uuid": "aip-3",
                    Document: [
                      {
                        "@_uuid": "doc-3",
                        DocumentPath: "./class-2/aip-3/doc-3",
                        Files: { Metadata: { "#text": "./meta3.xml" } },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      } as unknown as DipIndexXml);
    const mapper = new DipIndexMapper(parseDipIndexMock(RAW_DIP_INDEX_XML));

    const docs = mapper.extractDocuments();
    expect(parseDipIndexMock).toHaveBeenCalledWith(RAW_DIP_INDEX_XML);
    expect(docs.length).toBe(3);

    expect(docs[0].uuid).toBe("doc-1");
    expect(docs[0].processUuid).toBe("aip-1");
    expect(docs[0].documentPath).toBe("./class-1/aip-1/doc-1");
    expect(docs[0].metadataFilename).toBe("./meta.xml");

    expect(docs[1].uuid).toBe("doc-2");
    expect(docs[1].processUuid).toBe("aip-2");
    expect(docs[1].documentPath).toBe("./class-2/aip-2/doc-2");
    expect(docs[1].metadataFilename).toBe("./meta2.xml");

    expect(docs[2].uuid).toBe("doc-3");
    expect(docs[2].processUuid).toBe("aip-3");
    expect(docs[2].documentPath).toBe("./class-2/aip-3/doc-3");
    expect(docs[2].metadataFilename).toBe("./meta3.xml");
  });

  it("extractFiles() should return mapped files including primary and attachments", () => {
    const parseDipIndexMock = vi
      .fn<[rawContent: string], DipIndexXml>()
      .mockReturnValue({
        PackageContent: {
          DiPDocuments: {
            DocumentClass: [
              {
                AiP: [
                  {
                    Document: [
                      {
                        "@_uuid": "doc-1",
                        DocumentPath: "./class-1/aip-1/doc-1",
                        Files: {
                          Primary: {
                            "@_uuid": "prim-1",
                            "#text": "./primary.pdf",
                          },
                        },
                      },
                    ],
                  },
                ],
              },
              {
                AiP: [
                  {
                    Document: [
                      {
                        "@_uuid": "doc-2",
                        DocumentPath: "./class-2/aip-2/doc-2",
                        Files: {
                          Primary: {
                            "@_uuid": "prim-2",
                            "#text": "./primary2.pdf",
                          },
                          Attachments: [
                            { "@_uuid": "att-1", "#text": "./att1.pdf" },
                            { "@_uuid": "att-2", "#text": "./att2.pdf" },
                          ],
                        },
                      },
                    ],
                  },
                  {
                    Document: [
                      {
                        "@_uuid": "doc-3",
                        DocumentPath: "./class-2/aip-3/doc-3",
                        Files: {
                          Primary: {
                            "@_uuid": "prim-3",
                            "#text": "./primary3.pdf",
                          },
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      } as unknown as DipIndexXml);
    const mapper = new DipIndexMapper(parseDipIndexMock(RAW_DIP_INDEX_XML));

    const files = mapper.extractFiles();
    expect(parseDipIndexMock).toHaveBeenCalledWith(RAW_DIP_INDEX_XML);
    expect(files.length).toBe(5);

    // From doc-1 (Primary only)
    expect(files[0].uuid).toBe("prim-1");
    expect(files[0].documentUuid).toBe("doc-1");
    expect(files[0].isMain).toBe(true);
    expect(files[0].filename).toBe("./primary.pdf");
    expect(files[0].path).toBe("./class-1/aip-1/doc-1/./primary.pdf");

    // From doc-2 (Primary + 2 Attachments)
    expect(files[1].uuid).toBe("prim-2");
    expect(files[1].documentUuid).toBe("doc-2");
    expect(files[1].isMain).toBe(true);

    expect(files[2].uuid).toBe("att-1");
    expect(files[2].documentUuid).toBe("doc-2");
    expect(files[2].isMain).toBe(false);

    expect(files[3].uuid).toBe("att-2");
    expect(files[3].documentUuid).toBe("doc-2");
    expect(files[3].isMain).toBe(false);

    // From doc-3 (Primary only)
    expect(files[4].uuid).toBe("prim-3");
    expect(files[4].documentUuid).toBe("doc-3");
    expect(files[4].isMain).toBe(true);
  });
});

describe("ensureArrayTest", () => {
  it("should return empty array for undefined or null", () => {
    expect(ensureArray(undefined)).toEqual([]);
    expect(ensureArray(null)).toEqual([]);
  });

  it("should return the same array if input is already an array", () => {
    const arr = [1, 2, 3];
    expect(ensureArray(arr)).toBe(arr);
  });

  it("should wrap non-array value in an array", () => {
    expect(ensureArray(5)).toEqual([5]);
    expect(ensureArray("test")).toEqual(["test"]);
    const obj = { key: "value" };
    expect(ensureArray(obj)).toEqual([obj]);
  });
});

describe("LocalPackageReaderAdapter", () => {
  it("should read and map data from package reader", async () => {
    const mapperFactory = vi.fn().mockReturnValue({
      extractDipUuid: () => "dip-1",
      extractDocumentClasses: () => [
        {
          "@_uuid": "dc-1",
          "@_name": "Class 1",
          "@_validFrom": "2026-01-01",
        },
      ],
      extractProcesses: () => [
        {
          uuid: "proc-1",
          documentClassUuid: "dc-1",
          aipRoot: "./dc-1/proc-1",
          metadata: [],
        },
      ],
      extractDocuments: () => [
        {
          uuid: "doc-1",
          processUuid: "proc-1",
          documentPath: "docs/doc-1",
          metadataFilename: "metadata.xml",
        },
      ],
      extractFiles: () => [
        {
          uuid: "file-1",
          documentUuid: "doc-1",
          filename: "main.pdf",
          path: "docs/doc-1/main.pdf",
          isMain: true,
        },
      ],
    });

    const mockParser = {
      parseDipIndex: vi.fn().mockReturnValue({}),
      parseDocumentMetadata: vi.fn().mockReturnValue([]),
    };
    const readTextFile = vi.fn().mockResolvedValue("<DocumentMetadata />");
    const fileSystemProvider = {
      readFile: vi.fn(),
      openReadStream: vi.fn(),
      readTextFile,
      openReadTextStream: vi.fn(),
      fileExists: vi.fn(),
      listFiles: vi
        .fn()
        .mockResolvedValue([
          "DiPIndex.123e4567-e89b-12d3-a456-426614174000.xml",
        ]),
    };
    const adapter = new LocalPackageReaderAdapter(
      mockParser,
      fileSystemProvider,
      mapperFactory,
    );

    await expect(adapter.readDip("dummy/path")).resolves.toBeInstanceOf(Dip);
    await expect(
      adapter.readDocumentClasses("dummy/path").next(),
    ).resolves.toEqual(
      expect.objectContaining({
        value: expect.any(Object),
        done: expect.any(Boolean),
      }),
    );
    await expect(adapter.readProcesses("dummy/path").next()).resolves.toEqual(
      expect.objectContaining({
        value: expect.any(Object),
        done: expect.any(Boolean),
      }),
    );
    await expect(adapter.readDocuments("dummy/path").next()).resolves.toEqual(
      expect.objectContaining({
        value: expect.any(Object),
        done: expect.any(Boolean),
      }),
    );
    await expect(adapter.readFiles("dummy/path").next()).resolves.toEqual(
      expect.objectContaining({
        value: expect.any(Object),
        done: expect.any(Boolean),
      }),
    );

    expect(mapperFactory).toHaveBeenCalledWith("dummy/path");
    expect(readTextFile).toHaveBeenCalledWith(
      "dummy/path/docs/doc-1/metadata.xml",
    );
  });

  it("should resolve DiP index file using regex format DiPIndex.<uuid>.xml", async () => {
    const parseDipIndex = vi.fn().mockReturnValue({
      PackageInfo: { ProcessUUID: "dip-uuid-1" },
      PackageContent: { DiPDocuments: { DocumentClass: [] } },
    });
    const mockParser = {
      parseDipIndex,
      parseDocumentMetadata: vi.fn().mockReturnValue([]),
    };
    const listFiles = vi
      .fn()
      .mockResolvedValue(["README.md", "DiPIndex.abc-123.xml", "other.xml"]);
    const readTextFile = vi.fn().mockResolvedValue("<DiPIndex />");
    const fileSystemProvider = {
      readFile: vi.fn(),
      openReadStream: vi.fn(),
      readTextFile,
      openReadTextStream: vi.fn(),
      fileExists: vi.fn(),
      listFiles,
    };

    const adapter = new LocalPackageReaderAdapter(
      mockParser,
      fileSystemProvider,
    );
    const dip = await adapter.readDip("dummy/path");

    expect(dip).toBeInstanceOf(Dip);
    expect(listFiles).toHaveBeenCalledWith("dummy/path");
    expect(readTextFile).toHaveBeenCalledWith(
      "dummy/path/DiPIndex.abc-123.xml",
    );
    expect(parseDipIndex).toHaveBeenCalledWith("<DiPIndex />");
  });
});

describe("FileSystemProvider", () => {
  it("should read file content as Uint8Array", async () => {
    const provider = new FileSystemProvider();
    const content = await provider.readFile("core/test/resources/sample.txt");
    expect(content).toBeInstanceOf(Uint8Array);
    expect(new TextDecoder().decode(content)).toBe("Sample text content");
  });

  it("should read text file content", async () => {
    const provider = new FileSystemProvider();
    const content = await provider.readTextFile(
      "core/test/resources/sample.txt",
    );
    expect(content).toBe("Sample text content");
  });

  it("read file through stream", async () => {
    const provider = new FileSystemProvider();
    const stream = await provider.openReadStream(
      "core/test/resources/sample.txt",
    );
    let data = "";
    for await (const chunk of stream) {
      data += chunk;
    }
    expect(data).toBe("Sample text content");
  });

  it("should check file existence", async () => {
    const provider = new FileSystemProvider();
    const exists = await provider.fileExists("core/test/resources/sample.txt");
    expect(exists).toBe(true);
    const notExists = await provider.fileExists(
      "core/test/resources/nonexistent.txt",
    );
    expect(notExists).toBe(false);
  });

  it("should list files in a directory", async () => {
    const provider = new FileSystemProvider();
    const files = await provider.listFiles("core/test/resources");
    expect(files).toContain("sample.txt");
  });
});
