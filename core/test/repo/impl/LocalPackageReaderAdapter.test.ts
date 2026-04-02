import { describe, it, expect, vi, beforeEach, type Mocked } from "vitest";
import { LocalPackageReaderAdapter } from "../../../src/repo/impl/LocalPackageReaderAdapter";
import { IDipParser } from "../../../src/repo/impl/utils/IDipParser";
import { IFileSystemProvider } from "../../../src/repo/impl/utils/IFileSystemProvider";
import {
  IDataMapper,
  MapperRequest,
} from "../../../src/repo/impl/utils/IDataMapper";
import { Dip } from "../../../src/entity/Dip";
import { DocumentClass } from "../../../src/entity/DocumentClass";
import { Process } from "../../../src/entity/Process";
import { Document } from "../../../src/entity/Document";
import { File } from "../../../src/entity/File";

describe("LocalPackageReaderAdapter", () => {
  let parserMock: Mocked<IDipParser>;
  let fsProviderMock: Mocked<IFileSystemProvider>;
  let mapperMock: Mocked<IDataMapper>;
  let adapter: LocalPackageReaderAdapter;

  const dipPath = "/mock/dip/path";

  beforeEach(() => {
    parserMock = {
      parse: vi.fn(),
    } as unknown as Mocked<IDipParser>;

    fsProviderMock = {
      listFiles: vi.fn(),
      readTextFile: vi.fn(),
      openReadStream: vi.fn(),
      fileExists: vi.fn(),
    } as unknown as Mocked<IFileSystemProvider>;

    mapperMock = {
      mapDip: vi.fn(),
      mapDocumentClasses: vi.fn(),
      getProcessMappers: vi.fn(),
      getDocumentMappers: vi.fn(),
      getFileMappers: vi.fn(),
    } as unknown as Mocked<IDataMapper>;

    adapter = new LocalPackageReaderAdapter(
      parserMock,
      fsProviderMock,
      mapperMock,
    );
  });

  // identifier: TU-F-Indexing-07
  // method_name: readDip()
  // description: should throw if DiP index file is not found (Illegal path)
  // expected_value: throws if DiP index file is not found (Illegal path)
  it("TU-F-Indexing-07: readDip() should throw if DiP index file is not found (Illegal path)", async () => {
    fsProviderMock.listFiles.mockResolvedValue([
      "other-file.txt",
      "DiPIndex.old.txt",
    ]);

    await expect(adapter.readDip(dipPath)).rejects.toThrow(
      "DiP index file not found in '/mock/dip/path'. Expected format: DiPIndex.<uuid>.xml",
    );
  });

  // identifier: TU-F-Indexing-08
  // method_name: readDip()
  // description: should read the first alphabetically sorted DiP index file (Edge case) and return Dip
  // expected_value: matches asserted behavior: read the first alphabetically sorted DiP index file (Edge case) and return Dip
  it("TU-F-Indexing-08: readDip() should read the first alphabetically sorted DiP index file (Edge case) and return Dip", async () => {
    fsProviderMock.listFiles.mockResolvedValue([
      "DiPIndex.Z.xml",
      "DiPIndex.A.xml",
    ]);
    fsProviderMock.readTextFile.mockImplementation(async (filePath: string) => {
      if (filePath.endsWith("DiPIndex.A.xml")) {
        return "<xml>A</xml>";
      }
      return "<xml>Z</xml>";
    });
    parserMock.parse.mockImplementation((xml: string) => ({ xml }));
    mapperMock.mapDip.mockImplementation((rawDip: { xml: string }) => {
      if (rawDip.xml === "<xml>A</xml>") {
        return new Dip("dip-from-a");
      }
      return new Dip("dip-from-z");
    });

    const result = await adapter.readDip(dipPath);

    expect(result).toBeInstanceOf(Dip);
    expect(result.getUuid()).toBe("dip-from-a");
  });

  // identifier: TU-F-Indexing-09
  // method_name: readDocumentClasses()
  // description: should yield mapped document classes
  // expected_value: matches asserted behavior: yield mapped document classes
  it("TU-F-Indexing-09: readDocumentClasses() should yield mapped document classes", async () => {
    fsProviderMock.listFiles.mockResolvedValue(["DiPIndex.mock.xml"]);
    fsProviderMock.readTextFile.mockResolvedValue("<xml>dip-index</xml>");
    parserMock.parse.mockReturnValue({ dip: "index" });

    const mockClasses = [
      new DocumentClass("dip-uuid", "dc-1", "doc1", "2024"),
      new DocumentClass("dip-uuid", "dc-2", "doc2", "2024"),
    ];
    mapperMock.mapDocumentClasses.mockReturnValue(mockClasses);

    const results: DocumentClass[] = [];
    for await (const dc of adapter.readDocumentClasses(dipPath)) {
      results.push(dc);
    }

    expect(results).toHaveLength(2);
    expect(results[0]).toBeInstanceOf(DocumentClass);
    expect(results[0].getDipUuid()).toBe("dip-uuid");
    expect(results[0].getUuid()).toBe("dc-1");
    expect(results[0].getName()).toBe("doc1");
    expect(results[1]).toBeInstanceOf(DocumentClass);
    expect(results[1].getDipUuid()).toBe("dip-uuid");
    expect(results[1].getUuid()).toBe("dc-2");
    expect(results[1].getName()).toBe("doc2");
  });

  // identifier: TU-F-Indexing-10
  // method_name: readProcesses()
  // description: should yield mapped processes
  // expected_value: matches asserted behavior: should yield mapped processes (Legal metadata execution)
  it("TU-F-Indexing-10: readProcesses() should yield mapped processes (Legal metadata execution)", async () => {
    fsProviderMock.listFiles.mockResolvedValue(["DiPIndex.mock.xml"]);

    const processMapperMock: MapperRequest<Process> = {
      metadataRelativePath: "meta/AiPInfo.xml",
      map: vi.fn((rawMetadata: any) => {
        const suffix = rawMetadata?.meta === "parsed" ? "meta" : "fallback";
        return new Process("dc-uuid", `proc-${suffix}`, []);
      }),
    };
    mapperMock.getProcessMappers.mockReturnValue([processMapperMock]);

    fsProviderMock.readTextFile.mockImplementation(async (filePath: string) => {
      if (filePath.endsWith("DiPIndex.mock.xml")) {
        return "<index></index>";
      }
      return "<meta></meta>";
    });
    parserMock.parse
      .mockReturnValueOnce({ index: true })
      .mockReturnValueOnce({ meta: "parsed" });

    const results: Process[] = [];
    for await (const proc of adapter.readProcesses(dipPath)) {
      results.push(proc);
    }

    expect(results).toHaveLength(1);
    expect(results[0]).toBeInstanceOf(Process);
    expect(results[0].getDocumentClassUuid()).toBe("dc-uuid");
    expect(results[0].getUuid()).toBe("proc-meta");
    expect(results[0].getMetadata()).toEqual([]);
  });

  // identifier: TU-F-Indexing-11
  // method_name: readProcesses()
  // description: should handle missing metadata files gracefully by passing null (Edge case)
  // expected_value: matches asserted behavior: handle missing metadata files gracefully by passing null (Edge case)
  it("TU-F-Indexing-11: readProcesses() should handle missing metadata files gracefully by passing null (Edge case)", async () => {
    fsProviderMock.listFiles.mockResolvedValue(["DiPIndex.mock.xml"]);

    const processMapperMock: MapperRequest<Process> = {
      metadataRelativePath: "meta/MISSING.xml",
      map: vi.fn((rawMetadata: any) => {
        const suffix = rawMetadata ? "unexpected" : "null-metadata";
        return new Process("dc-uuid", `proc-${suffix}`, []);
      }),
    };
    mapperMock.getProcessMappers.mockReturnValue([processMapperMock]);

    fsProviderMock.readTextFile.mockResolvedValueOnce("<index></index>");
    fsProviderMock.readTextFile.mockRejectedValueOnce(
      new Error("File not found"),
    );
    parserMock.parse.mockReturnValue({ index: true });

    const results: Process[] = [];
    for await (const proc of adapter.readProcesses(dipPath)) {
      results.push(proc);
    }

    expect(results).toHaveLength(1);
    expect(results[0]).toBeInstanceOf(Process);
    expect(results[0].getDocumentClassUuid()).toBe("dc-uuid");
    expect(results[0].getUuid()).toBe("proc-null-metadata");
    expect(results[0].getMetadata()).toEqual([]);
  });

  // identifier: TU-F-Indexing-12
  // method_name: readDocuments()
  // description: should safely skip metadata fetch if relative path is null
  // expected_value: matches asserted behavior: safely skip metadata fetch if relative path is null
  it("TU-F-Indexing-12: readDocuments() should safely skip metadata fetch if relative path is null", async () => {
    fsProviderMock.listFiles.mockResolvedValue(["DiPIndex.mock.xml"]);
    fsProviderMock.readTextFile.mockResolvedValueOnce("<index></index>");
    parserMock.parse.mockReturnValue({ index: true });

    const docMapperMock: MapperRequest<Document> = {
      metadataRelativePath: null,
      map: vi.fn((rawMetadata: any) => {
        const docId = rawMetadata
          ? "doc-with-metadata"
          : "doc-without-metadata";
        return new Document(docId, [], "proc-uuid");
      }),
    };
    mapperMock.getDocumentMappers.mockReturnValue([docMapperMock]);

    const results: Document[] = [];
    for await (const doc of adapter.readDocuments(dipPath)) {
      results.push(doc);
    }

    expect(results).toHaveLength(1);
    expect(results[0]).toBeInstanceOf(Document);
    expect(results[0].getUuid()).toBe("doc-without-metadata");
    expect(results[0].getProcessUuid()).toBe("proc-uuid");
    expect(results[0].getMetadata()).toEqual([]);
  });

  // identifier: TU-F-Indexing-13
  // method_name: readFileBytes()
  // description: should return stream from file system provider
  // expected_value: returns stream from file system provider
  it("TU-F-Indexing-13: readFileBytes() should return stream from file system provider", async () => {
    // Mock file content
    const mockContent = "mock file content";
    // Create a mock Readable stream
    const { Readable } = await import("node:stream");
    const mockStream = Readable.from([mockContent]);
    fsProviderMock.openReadStream.mockResolvedValue(
      mockStream as unknown as NodeJS.ReadableStream,
    );

    const resultStream = await adapter.readFileBytes("/path/to/my/file.pdf");
    let data = "";
    await new Promise((resolve, reject) => {
      resultStream.setEncoding("utf8");
      resultStream.on("data", (chunk: string) => {
        data += chunk;
      });
      resultStream.on("end", resolve);
      resultStream.on("error", reject);
    });

    expect(data).toBe(mockContent);
  });

  // identifier: TU-F-Indexing-14
  // method_name: readFiles()
  // description: should fetch paths correctly from file mappers
  // expected_value: matches asserted behavior: fetch paths correctly from file mappers
  it("TU-F-Indexing-14: readFiles() should fetch paths correctly from file mappers", async () => {
    fsProviderMock.listFiles.mockResolvedValue(["DiPIndex.mock.xml"]);
    fsProviderMock.readTextFile.mockResolvedValueOnce("<index></index>");
    parserMock.parse.mockReturnValue({ index: true });

    const fileMapperMock: MapperRequest<File> = {
      metadataRelativePath: null,
      map: vi.fn((rawMetadata: any) => {
        const filePath = rawMetadata ? "path/with-meta" : "path/without-meta";
        return new File("some-file", filePath, "hash", true, "", "doc-uuid");
      }),
    };
    mapperMock.getFileMappers.mockReturnValue([fileMapperMock]);

    const results: File[] = [];
    for await (const f of adapter.readFiles(dipPath)) {
      results.push(f);
    }

    expect(results).toHaveLength(1);
    expect(results[0]).toBeInstanceOf(File);
    expect(results[0].getFilename()).toBe("some-file");
    expect(results[0].getPath()).toBe("path/without-meta");
    expect(results[0].getHash()).toBe("hash");
    expect(results[0].getIsMain()).toBe(true);
    expect(results[0].getDocumentUuid()).toBe("doc-uuid");
  });
});
