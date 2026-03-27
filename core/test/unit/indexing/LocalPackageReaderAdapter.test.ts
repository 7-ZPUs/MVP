import { describe, it, expect, vi, beforeEach } from "vitest";
import * as path from "node:path";
import { LocalPackageReaderAdapter } from "../../../src/repo/impl/LocalPackageReaderAdapter";
import { IDipParser } from "../../../src/repo/impl/utils/IDipParser";
import { IFileSystemProvider } from "../../../src/repo/impl/utils/IFileSystemProvider";
import { IDataMapper, MapperRequest } from "../../../src/repo/impl/utils/IDataMapper";
import { Dip } from "../../../src/entity/Dip";
import { DocumentClass } from "../../../src/entity/DocumentClass";
import { Process } from "../../../src/entity/Process";
import { Document } from "../../../src/entity/Document";
import { File } from "../../../src/entity/File";

describe("LocalPackageReaderAdapter", () => {
  let parserMock: vi.Mocked<IDipParser>;
  let fsProviderMock: vi.Mocked<IFileSystemProvider>;
  let mapperMock: vi.Mocked<IDataMapper>;
  let adapter: LocalPackageReaderAdapter;

  const dipPath = "/mock/dip/path";

  beforeEach(() => {
    parserMock = {
      parse: vi.fn(),
    } as unknown as vi.Mocked<IDipParser>;

    fsProviderMock = {
      listFiles: vi.fn(),
      readTextFile: vi.fn(),
      openReadStream: vi.fn(),
      fileExists: vi.fn(),
    } as unknown as vi.Mocked<IFileSystemProvider>;

    mapperMock = {
      mapDip: vi.fn(),
      mapDocumentClasses: vi.fn(),
      getProcessMappers: vi.fn(),
      getDocumentMappers: vi.fn(),
      getFileMappers: vi.fn(),
    } as unknown as vi.Mocked<IDataMapper>;

    adapter = new LocalPackageReaderAdapter(
      parserMock,
      fsProviderMock,
      mapperMock
    );
  });

  // identifier: TU-F-I-48
  // method_name: readDip()
  // description: should throw if DiP index file is not found (Illegal path)
  // expected_value: throws if DiP index file is not found (Illegal path)
  it("TU-LPR-01: readDip() should throw if DiP index file is not found (Illegal path)", async () => {
    fsProviderMock.listFiles.mockResolvedValue(["other-file.txt", "DiPIndex.old.txt"]);

    await expect(adapter.readDip(dipPath))
      .rejects
      .toThrow("DiP index file not found in '/mock/dip/path'. Expected format: DiPIndex.<uuid>.xml");
  });

  // identifier: TU-F-I-49
  // method_name: readDip()
  // description: should read the first alphabetically sorted DiP index file (Edge case) and return Dip
  // expected_value: matches asserted behavior: read the first alphabetically sorted DiP index file (Edge case) and return Dip
  it("TU-LPR-02: readDip() should read the first alphabetically sorted DiP index file (Edge case) and return Dip", async () => {
    fsProviderMock.listFiles.mockResolvedValue([
      "DiPIndex.Z.xml", 
      "DiPIndex.A.xml"
    ]);
    fsProviderMock.readTextFile.mockResolvedValue("<xml>Mock</xml>");
    parserMock.parse.mockReturnValue({ parsed: true });
    
    const mockDip = new Dip("dip-uuid");
    mapperMock.mapDip.mockReturnValue(mockDip);

    const result = await adapter.readDip(dipPath);

    expect(fsProviderMock.listFiles).toHaveBeenCalledWith(dipPath);
    expect(fsProviderMock.readTextFile).toHaveBeenCalledWith(path.join(dipPath, "DiPIndex.A.xml"));
    expect(parserMock.parse).toHaveBeenCalledWith("<xml>Mock</xml>");
    expect(mapperMock.mapDip).toHaveBeenCalledWith({ parsed: true });
    expect(result).toBe(mockDip);
  });

  // identifier: TU-F-I-50
  // method_name: readDocumentClasses()
  // description: should yield mapped document classes
  // expected_value: matches asserted behavior: yield mapped document classes
  it("TU-LPR-03: readDocumentClasses() should yield mapped document classes", async () => {
    fsProviderMock.listFiles.mockResolvedValue(["DiPIndex.mock.xml"]);
    
    const mockClasses = [
      new DocumentClass("dip-uuid", "dc-1", "doc1", "2024"),
      new DocumentClass("dip-uuid", "dc-2", "doc2", "2024")
    ];
    mapperMock.mapDocumentClasses.mockReturnValue(mockClasses);

    const results: DocumentClass[] = [];
    for await (const dc of adapter.readDocumentClasses(dipPath)) {
      results.push(dc);
    }

    expect(results).toHaveLength(2);
    expect(results).toEqual(mockClasses);
  });

  // identifier: TU-F-I-51
  // method_name: readProcesses()
  // description: should fetch metadata files and pass to map (Legal metadata execution)
  // expected_value: matches asserted behavior: fetch metadata files and pass to map (Legal metadata execution)
  it("TU-LPR-04: readProcesses() should fetch metadata files and pass to map (Legal metadata execution)", async () => {
    fsProviderMock.listFiles.mockResolvedValue(["DiPIndex.mock.xml"]);
    
    const processMapperMock: MapperRequest<Process> = {
      metadataRelativePath: "meta/AiPInfo.xml",
      map: vi.fn()
    };
    mapperMock.getProcessMappers.mockReturnValue([processMapperMock]);

    // Mock reading the metadata
    fsProviderMock.readTextFile.mockResolvedValueOnce("<index></index>"); // Index read
    fsProviderMock.readTextFile.mockResolvedValueOnce("<meta></meta>"); // Metadata read
    parserMock.parse.mockReturnValueOnce({ index: true }); // Index parse
    parserMock.parse.mockReturnValueOnce({ meta: "parsed" }); // Metadata parse

    const mockProcess = new Process("dc-uuid", "proc-uuid", []);
    vi.mocked(processMapperMock.map).mockReturnValue(mockProcess);

    const results: Process[] = [];
    for await (const proc of adapter.readProcesses(dipPath)) {
      results.push(proc);
    }

    expect(results).toHaveLength(1);
    expect(fsProviderMock.readTextFile).toHaveBeenCalledWith(path.join(dipPath, "meta/AiPInfo.xml"));
    expect(processMapperMock.map).toHaveBeenCalledWith({ meta: "parsed" });
    expect(results[0]).toBe(mockProcess);
  });

  // identifier: TU-F-I-52
  // method_name: readProcesses()
  // description: should handle missing metadata files gracefully by passing null (Edge case)
  // expected_value: matches asserted behavior: handle missing metadata files gracefully by passing null (Edge case)
  it("TU-LPR-05: readProcesses() should handle missing metadata files gracefully by passing null (Edge case)", async () => {
    fsProviderMock.listFiles.mockResolvedValue(["DiPIndex.mock.xml"]);
    
    const processMapperMock: MapperRequest<Process> = {
      metadataRelativePath: "meta/MISSING.xml",
      map: vi.fn()
    };
    mapperMock.getProcessMappers.mockReturnValue([processMapperMock]);

    // Mock rejecting on metadata read
    fsProviderMock.readTextFile.mockResolvedValueOnce("<index></index>"); // Index read
    fsProviderMock.readTextFile.mockRejectedValueOnce(new Error("File not found")); // Metadata throws
    
    const mockProcess = new Process("dc-uuid", "proc-uuid", []);
    vi.mocked(processMapperMock.map).mockReturnValue(mockProcess);

    const results: Process[] = [];
    for await (const proc of adapter.readProcesses(dipPath)) {
      results.push(proc);
    }

    expect(results).toHaveLength(1);
    expect(processMapperMock.map).toHaveBeenCalledWith(null); // Passed null due to catch block
  });

  // identifier: TU-F-I-53
  // method_name: readDocuments()
  // description: should safely skip metadata fetch if relative path is null
  // expected_value: matches asserted behavior: safely skip metadata fetch if relative path is null
  it("TU-LPR-06: readDocuments() should safely skip metadata fetch if relative path is null", async () => {
    fsProviderMock.listFiles.mockResolvedValue(["DiPIndex.mock.xml"]);
    fsProviderMock.readTextFile.mockResolvedValueOnce("<index></index>");
    
    const docMapperMock: MapperRequest<Document> = {
      metadataRelativePath: null,
      map: vi.fn()
    };
    mapperMock.getDocumentMappers.mockReturnValue([docMapperMock]);

    const mockDoc = new Document("doc-uuid", [], "proc-uuid");
    vi.mocked(docMapperMock.map).mockReturnValue(mockDoc);

    const results: Document[] = [];
    for await (const doc of adapter.readDocuments(dipPath)) {
      results.push(doc);
    }

    expect(results).toHaveLength(1);
    // Should only read text file once (for the DiPIndex)
    expect(fsProviderMock.readTextFile).toHaveBeenCalledTimes(1);
    expect(docMapperMock.map).toHaveBeenCalledWith(null);
  });

  // identifier: TU-F-I-54
  // method_name: readFileBytes()
  // description: should return stream from file system provider
  // expected_value: returns stream from file system provider
  it("TU-LPR-07: readFileBytes() should return stream from file system provider", async () => {
    const mockStream = {} as NodeJS.ReadableStream;
    fsProviderMock.openReadStream.mockResolvedValue(mockStream);

    const result = await adapter.readFileBytes("/path/to/my/file.pdf");
    
    expect(fsProviderMock.openReadStream).toHaveBeenCalledWith("/path/to/my/file.pdf");
    expect(result).toBe(mockStream);
  });

  // identifier: TU-F-I-55
  // method_name: readFiles()
  // description: should fetch paths correctly from file mappers
  // expected_value: matches asserted behavior: fetch paths correctly from file mappers
  it("TU-LPR-08: readFiles() should fetch paths correctly from file mappers", async () => {
    fsProviderMock.listFiles.mockResolvedValue(["DiPIndex.mock.xml"]);
    fsProviderMock.readTextFile.mockResolvedValueOnce("<index></index>");
    
    const fileMapperMock: MapperRequest<File> = {
      metadataRelativePath: null,
      map: vi.fn()
    };
    mapperMock.getFileMappers.mockReturnValue([fileMapperMock]);

    const mockFile = new File("some-file", "path/some-file", "hash", true, "doc-uuid");
    vi.mocked(fileMapperMock.map).mockReturnValue(mockFile);

    const results: File[] = [];
    for await (const f of adapter.readFiles(dipPath)) {
      results.push(f);
    }

    expect(results).toHaveLength(1);
    expect(fileMapperMock.map).toHaveBeenCalledWith(null);
  });
});
