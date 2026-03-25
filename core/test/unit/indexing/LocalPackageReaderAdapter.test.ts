import { readFileSync } from "node:fs";
import { describe, it, expect, vi } from "vitest";
import { XmlDipParser } from "../../../src/repo/impl/utils/XmlDipParser";
import { DipIndexMapper } from "../../../src/repo/impl/utils/DipIndexMapper";
import { ensureArray } from "../../../src/repo/impl/utils/ensureArray";
import type { DipIndexXml } from "../../../src/repo/xml-types/DipIndexXml";
import { LocalPackageReaderAdapter } from "../../../src/repo/impl/LocalPackageReaderAdapter";
import { Dip } from "../../../src/entity/Dip";
import { FileSystemProvider } from "../../../src/repo/impl/utils/FileSystemProvider";
import { Metadata, MetadataType } from "../../../src/value-objects/Metadata";

describe("ParserTests", () => {
  it("TU-F-I-14: parseDipIndex() with valid XML input", () => {
    const xmlContent = readFileSync(
      "core/test/resources/dipindex_test.xml",
      "utf-8",
    );
    const parser = new XmlDipParser();
    const result = parser.parseDipIndex(xmlContent);

    expect(result.dipUuid).toBe("test-dip-uuid-1234");
    expect(result.documentClasses).toHaveLength(2);
    expect(result.processes).toHaveLength(3);
    expect(result.documents).toHaveLength(3);
    expect(result.files).toHaveLength(5);
    expect(result.documentClasses[0]).toMatchObject({
      uuid: "class-1",
      name: "Class1",
    });
    expect(result.processes[0].uuid).toBe("aip-1");
    expect(result.documents[0].uuid).toBe("doc-1");
    expect(result.files[0]).toMatchObject({
      documentUuid: "doc-1",
      filename: "./primary.pdf",
      isMain: true,
    });
  });

  it("TU-F-I-15: parseDipIndex() with invalid XML input should throw", () => {
    const invalidXml = "<Invalid></Invalid>";
    const parser = new XmlDipParser();
    expect(() => parser.parseDipIndex(invalidXml)).toThrow(
      "Invalid DiPIndex XML: missing root element 'DiPIndex'",
    );
  });

  it("TU-F-I-16: parseDocumentMetadata() with valid XML input including nested metadata", () => {
    const xmlContent = readFileSync(
      "core/test/resources/metadata_test.xml",
      "utf-8",
    );
    const parser = new XmlDipParser();
    const result = parser.parseDocumentMetadata(xmlContent);

    expect(result.length).toBe(5);

    // Metadata gerarchica (Soggetti -> [Ruolo, Ruolo])
    const soggetti = result.find((m) => m.name === "Soggetti");
    expect(soggetti?.type).toBe(MetadataType.COMPOSITE);
    const ruoli = soggetti?.value as Metadata[];
    expect(ruoli).toHaveLength(2);

    expect(ruoli[0].name).toBe("Ruolo");
    expect((ruoli[0].value as Metadata[])[0].name).toBe("Tipo");
    expect((ruoli[0].value as Metadata[])[0].value).toBe("Autore");

    expect(ruoli[1].name).toBe("Ruolo");
    expect((ruoli[1].value as Metadata[])[0].name).toBe("Tipo");
    expect((ruoli[1].value as Metadata[])[0].value).toBe("Destinatario");

    // Metadata gerarchica simplex (IdDoc -> [Identificativo])
    const idDoc = result.find((m) => m.name === "IdDoc");
    expect(idDoc?.type).toBe(MetadataType.COMPOSITE);
    const idDocChildren = idDoc?.value as Metadata[];
    expect(idDocChildren[0].name).toBe("Identificativo");
    expect(idDocChildren[0].value).toBe("12345");

    // Booleano
    expect(result.find((m) => m.name === "Riservato")?.value).toBe("true");
    expect(result.find((m) => m.name === "Riservato")?.type).toBe(
      MetadataType.BOOLEAN,
    );

    // Numero
    expect(result.find((m) => m.name === "TempoDiConservazione")?.value).toBe(
      "10",
    );
    expect(result.find((m) => m.name === "TempoDiConservazione")?.type).toBe(
      MetadataType.NUMBER,
    );

    // Stringa
    expect(result.find((m) => m.name === "Titolo")?.value).toBe(
      "Documento di test",
    );
  });

  it("TU-F-I-17: parseDocumentMetadata() with invalid XML input should throw", () => {
    const invalidXml = "<Invalid></Invalid>";
    const parser = new XmlDipParser();
    expect(() => parser.parseDocumentMetadata(invalidXml)).toThrow(
      "Invalid metadata XML: missing expected root element",
    );
  });

  it("TU-F-I-27: parseProcessMetadata() with valid XML input", () => {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<AiPInfo>
  <Start>WebGui</Start>
  <End>Completata</End>
  <ProcessData>
    <SessionId>session-123</SessionId>
  </ProcessData>
</AiPInfo>`;
    const parser = new XmlDipParser();
    const result = parser.parseProcessMetadata(xmlContent);

    expect(result).toContainEqual(
      new Metadata("Start", "WebGui", MetadataType.STRING),
    );
    expect(result).toContainEqual(
      new Metadata("End", "Completata", MetadataType.STRING),
    );

    const processData = result.find((m) => m.name === "ProcessData");
    expect(processData?.type).toBe(MetadataType.COMPOSITE);
    const children = processData?.value as Metadata[];
    expect(children[0].name).toBe("SessionId");
    expect(children[0].value).toBe("session-123");
  });
});

describe("DipIndexMapperTests", () => {
  const RAW_DIP_INDEX_XML = "<DiPIndex />";

  it("TU-F-I-18: extractDipUuid() should return correct UUID", () => {
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

  it("TU-F-I-19: extractDocumentClasses() should return document classes", () => {
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

  it("TU-F-I-20: extractProcesses() should return mapped processes", () => {
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

  it("TU-F-I-21: extractDocuments() should return mapped documents", () => {
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

  it("TU-F-I-22: extractFiles() should return mapped files including primary and attachments", () => {
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

  it("TU-F-I-23: mapFile() should correctly map file with given parameters", () => {
    const mapper = new DipIndexMapper({} as DipIndexXml);
    const mappedFile = mapper["mapFile"](
      { "@_uuid": "file-1", "#text": "file.pdf" },
      "doc-1",
      "./base/path",
      true,
    );

    expect(mappedFile).toEqual({
      uuid: "file-1",
      documentUuid: "doc-1",
      filename: "file.pdf",
      path: "./base/path/file.pdf",
      isMain: true,
    });
  });
});

describe("ensureArrayTest", () => {
  it("TU-F-I-24: should return empty array for undefined or null", () => {
    expect(ensureArray(undefined)).toEqual([]);
    expect(ensureArray(null)).toEqual([]);
  });

  it("TU-F-I-25: should return the same array if input is already an array", () => {
    const arr = [1, 2, 3];
    expect(ensureArray(arr)).toBe(arr);
  });

  it("TU-F-I-26: should wrap non-array value in an array", () => {
    expect(ensureArray(5)).toEqual([5]);
    expect(ensureArray("test")).toEqual(["test"]);
    const obj = { key: "value" };
    expect(ensureArray(obj)).toEqual([obj]);
  });
});

describe("LocalPackageReaderAdapter", () => {
  const PARSED_DIP_INDEX = {
    dipUuid: "dip-1",
    documentClasses: [
      { uuid: "dc-1", name: "Class 1", timestamp: "2026-01-01" },
    ],
    processes: [
      {
        uuid: "proc-1",
        documentClassUuid: "dc-1",
        aipRoot: "./dc-1/proc-1",
        metadata: [],
      },
    ],
    documents: [
      {
        uuid: "doc-1",
        processUuid: "proc-1",
        documentPath: "docs/doc-1",
        metadataFilename: "metadata.xml",
      },
    ],
    files: [
      {
        uuid: "file-1",
        documentUuid: "doc-1",
        filename: "main.pdf",
        path: "docs/doc-1/main.pdf",
        isMain: true,
      },
    ],
  };

  const getMockDeps = () => {
    const mockParser: any = {
      parseDipIndex: vi.fn(),
      parseDocumentMetadata: vi.fn(),
      parseProcessMetadata: vi.fn(),
    };
    const mockFileSystem: any = {
      readFile: vi.fn(),
      openReadStream: vi.fn(),
      readTextFile: vi.fn(),
      openReadTextStream: vi.fn(),
      fileExists: vi.fn(),
      listFiles: vi.fn(),
    };
    return { mockParser, mockFileSystem };
  };

  it("TU-F-I-01: readDip() should return the DiP core entity", async () => {
    const { mockParser, mockFileSystem } = getMockDeps();
    mockParser.parseDipIndex.mockReturnValue(PARSED_DIP_INDEX);
    mockFileSystem.listFiles.mockResolvedValue(["DiPIndex.uuid.xml"]);
    mockFileSystem.readTextFile.mockResolvedValue("<DiPIndex />");

    const adapter = new LocalPackageReaderAdapter(mockParser, mockFileSystem);
    const dip = await adapter.readDip("dummy/path");

    expect(dip).toBeInstanceOf(Dip);
    expect(dip.getUuid()).toBe("dip-1");
  });

  it("TU-F-I-02: readDocumentClasses() should iterate and return mapped document classes", async () => {
    const { mockParser, mockFileSystem } = getMockDeps();
    mockParser.parseDipIndex.mockReturnValue(PARSED_DIP_INDEX);
    mockFileSystem.listFiles.mockResolvedValue(["DiPIndex.uuid.xml"]);
    mockFileSystem.readTextFile.mockResolvedValue("<DiPIndex />");

    const adapter = new LocalPackageReaderAdapter(mockParser, mockFileSystem);
    const itr = await adapter.readDocumentClasses("dummy/path").next();

    expect(itr.value).toBeDefined();
    expect(itr.value?.getDipUuid()).toBe("dip-1");
    expect(itr.value?.getUuid()).toBe("dc-1");
    expect(itr.value?.getName()).toBe("Class 1");
  });

  it("TU-F-I-03: readProcesses() should iterate, read AiPInfo, parse process metadata and return mapped processes", async () => {
    const { mockParser, mockFileSystem } = getMockDeps();
    mockParser.parseDipIndex.mockReturnValue(PARSED_DIP_INDEX);
    mockFileSystem.listFiles.mockResolvedValue(["DiPIndex.uuid.xml"]);
    mockFileSystem.readTextFile.mockResolvedValue("<DiPIndex />");

    const mockProcessMetadata = [
      new Metadata("Start", "WebGui", MetadataType.STRING),
      new Metadata("End", "Completata", MetadataType.STRING),
      new Metadata("SubmissionSession", "Completed", MetadataType.STRING),
      new Metadata("PreservationSession", "Saved", MetadataType.STRING),
    ];
    mockParser.parseProcessMetadata.mockReturnValue(mockProcessMetadata);

    const adapter = new LocalPackageReaderAdapter(mockParser, mockFileSystem);
    const itr = await adapter.readProcesses("dummy/path").next();

    expect(itr.value).toBeDefined();
    expect(itr.value?.getDocumentClassUuid()).toBe("dc-1");
    expect(itr.value?.getUuid()).toBe("proc-1");
    expect(itr.value?.getMetadata()).toEqual(mockProcessMetadata);

    expect(mockFileSystem.readTextFile).toHaveBeenCalledWith(
      "dummy/path/dc-1/proc-1/AiPInfo.proc-1.xml",
    );
  });

  it("TU-F-I-04: readDocuments() should iterate, read metadata.xml, parse doc metadata and return mapped documents", async () => {
    const { mockParser, mockFileSystem } = getMockDeps();
    mockParser.parseDipIndex.mockReturnValue(PARSED_DIP_INDEX);
    mockFileSystem.listFiles.mockResolvedValue(["DiPIndex.uuid.xml"]);
    mockFileSystem.readTextFile.mockResolvedValue("<DiPIndex />");

    const mockDocMetadata = [
      new Metadata("TipologiaDocumentale", "Note Spese", MetadataType.STRING),
      new Metadata("Riservato", "false", MetadataType.BOOLEAN),
      new Metadata(
        "DatiProtocollo",
        [new Metadata("Numero", "2023-001", MetadataType.STRING)],
        MetadataType.COMPOSITE,
      ),
      new Metadata("Soggetti", "[object Object]", MetadataType.STRING),
    ];
    mockParser.parseDocumentMetadata.mockReturnValue(mockDocMetadata);

    const adapter = new LocalPackageReaderAdapter(mockParser, mockFileSystem);
    const itr = await adapter.readDocuments("dummy/path").next();

    expect(itr.value).toBeDefined();
    expect(itr.value?.getProcessUuid()).toBe("proc-1");
    expect(itr.value?.getUuid()).toBe("doc-1");
    expect(itr.value?.getMetadata()).toEqual(mockDocMetadata);

    expect(mockFileSystem.readTextFile).toHaveBeenCalledWith(
      "dummy/path/dc-1/proc-1/docs/doc-1/metadata.xml",
    );
  });

  it("TU-F-I-05: readFiles() should iterate and return mapped files", async () => {
    const { mockParser, mockFileSystem } = getMockDeps();
    mockParser.parseDipIndex.mockReturnValue(PARSED_DIP_INDEX);
    mockFileSystem.listFiles.mockResolvedValue(["DiPIndex.uuid.xml"]);
    mockFileSystem.readTextFile.mockResolvedValue("<DiPIndex />");

    const adapter = new LocalPackageReaderAdapter(mockParser, mockFileSystem);
    const itr = await adapter.readFiles("dummy/path").next();

    expect(itr.value).toBeDefined();
    expect(itr.value?.getDocumentUuid()).toBe("doc-1");
    expect(itr.value?.getFilename()).toBe("main.pdf");
    expect(itr.value?.getPath()).toBe("dc-1/proc-1/docs/doc-1/main.pdf");
    expect(itr.value?.getIsMain()).toBe(true);
  });

  it("TU-F-I-06: readFileBytes() should delegate stream opening to file system provider", async () => {
    const { mockParser, mockFileSystem } = getMockDeps();
    const adapter = new LocalPackageReaderAdapter(mockParser, mockFileSystem);

    mockFileSystem.openReadStream.mockReturnValue("mock-stream");
    const stream = await adapter.readFileBytes("dummy/path/file.pdf");

    expect(stream).toBe("mock-stream");
    expect(mockFileSystem.openReadStream).toHaveBeenCalledWith(
      "dummy/path/file.pdf",
    );
  });

  it("TU-F-I-07: should resolve DiP index file using regex format DiPIndex.<uuid>.xml", async () => {
    const { mockParser, mockFileSystem } = getMockDeps();
    mockParser.parseDipIndex.mockReturnValue({
      dipUuid: "dip-uuid-1",
      documentClasses: [],
      processes: [],
      documents: [],
      files: [],
    });
    mockFileSystem.listFiles.mockResolvedValue([
      "README.md",
      "DiPIndex.abc-123.xml",
      "other.xml",
    ]);
    mockFileSystem.readTextFile.mockResolvedValue("<DiPIndex />");

    const adapter = new LocalPackageReaderAdapter(mockParser, mockFileSystem);
    const dip = await adapter.readDip("dummy/path");

    expect(dip).toBeInstanceOf(Dip);
    expect(mockFileSystem.listFiles).toHaveBeenCalledWith("dummy/path");
    expect(mockFileSystem.readTextFile).toHaveBeenCalledWith(
      "dummy/path/DiPIndex.abc-123.xml",
    );
    expect(mockParser.parseDipIndex).toHaveBeenCalledWith("<DiPIndex />");
  });

  it("TU-F-I-08: should reuse current parsed index for the same dipPath and reload for a different dipPath", async () => {
    const { mockParser, mockFileSystem } = getMockDeps();
    mockParser.parseDipIndex.mockReturnValue({
      dipUuid: "dip-uuid-1",
      documentClasses: [],
      processes: [],
      documents: [],
      files: [],
    });
    mockFileSystem.listFiles.mockResolvedValue(["DiPIndex.aaa.xml"]);
    mockFileSystem.readTextFile.mockResolvedValue("<DiPIndex />");

    const adapter = new LocalPackageReaderAdapter(mockParser, mockFileSystem);

    await adapter.readDip("dip/path/a");
    await adapter.readDip("dip/path/a");
    await adapter.readDip("dip/path/b");

    expect(mockParser.parseDipIndex).toHaveBeenCalledTimes(2);
    expect(mockFileSystem.listFiles).toHaveBeenCalledTimes(2);
    expect(mockFileSystem.readTextFile).toHaveBeenNthCalledWith(
      1,
      "dip/path/a/DiPIndex.aaa.xml",
    );
    expect(mockFileSystem.readTextFile).toHaveBeenNthCalledWith(
      2,
      "dip/path/b/DiPIndex.aaa.xml",
    );
  });
});

describe("FileSystemProvider", () => {
  it("TU-F-I-09: should read file content as Uint8Array", async () => {
    const provider = new FileSystemProvider();
    const content = await provider.readFile("core/test/resources/sample.txt");
    expect(content).toBeInstanceOf(Uint8Array);
    expect(new TextDecoder().decode(content)).toBe("Sample text content");
  });

  it("TU-F-I-10: should read text file content", async () => {
    const provider = new FileSystemProvider();
    const content = await provider.readTextFile(
      "core/test/resources/sample.txt",
    );
    expect(content).toBe("Sample text content");
  });

  it("TU-F-I-11: read file through stream", async () => {
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

  it("TU-F-I-12: should check file existence", async () => {
    const provider = new FileSystemProvider();
    const exists = await provider.fileExists("core/test/resources/sample.txt");
    expect(exists).toBe(true);
    const notExists = await provider.fileExists(
      "core/test/resources/nonexistent.txt",
    );
    expect(notExists).toBe(false);
  });

  it("TU-F-I-13: should list files in a directory", async () => {
    const provider = new FileSystemProvider();
    const files = await provider.listFiles("core/test/resources");
    expect(files).toContain("sample.txt");
  });
});
