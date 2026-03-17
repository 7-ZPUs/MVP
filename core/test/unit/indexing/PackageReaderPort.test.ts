import { describe, it, expect, vi, afterEach } from "vitest";
import { LocalPackageReaderAdapter } from "../../../src/repo/impl/utils/LocalPackageReaderAdapter";
import { IDiPIndexParser } from "../../../src/repo/impl/utils/IDipIndexParser";
import { DiPIndexXml } from "../../../src/repo/xml-types/DiPIndexXml";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

async function collectAll<T>(gen: AsyncGenerator<T>): Promise<T[]> {
  const items: T[] = [];
  for await (const item of gen) items.push(item);
  return items;
}

function minimalDiPIndex(): DiPIndexXml {
  return {
    ComplianceStatement: [],
    PackageInfo: {
      CreatingApplication: { Name: "Test", Version: "1.0", Producer: "Test" },
      ProcessUUID: "dip-uuid-001",
      CreationDate: "2024-01-01",
      DocumentsCount: 1,
      AiPCount: 1,
    },
    PackageContent: {
      DiPDocuments: {
        Statement: { "#text": "test", "@_lang": "it" },
        DocumentClass: [
          {
            "@_uuid": "dc-uuid-001",
            "@_name": "Fatture",
            "@_version": "1.0",
            "@_validFrom": "2024-01-01T00:00:00+01:00",
            AiP: [
              {
                "@_uuid": "aip-uuid-001",
                AiPRoot: "AiP/aip-uuid-001",
                Document: [
                  {
                    "@_uuid": "doc-uuid-001",
                    DocumentPath: "AiP/aip-uuid-001/doc-uuid-001",
                    Files: {
                      "@_FilesCount": 2,
                      Metadata: {
                        "#text": "metadata.xml",
                        "@_uuid": "file-meta-001",
                      },
                      Primary: {
                        "#text": "fattura.pdf",
                        "@_uuid": "file-primary-001",
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
  };
}

function createStubParser(index: DiPIndexXml): IDiPIndexParser {
  return { parse: vi.fn(() => index) };
}

describe("LocalPackageReaderAdapter (IPackageReaderPort)", () => {
  let tmpDir: string;

  function setupDipDir(): string {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pkg-reader-test-"));
    fs.writeFileSync(path.join(tmpDir, "DiPIndex.xml"), "<stub/>", "utf-8");
    return tmpDir;
  }

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true });
    }
  });

  describe("readDip", () => {
    it("should yield exactly one Dip with the UUID from the index", async () => {
      const index = minimalDiPIndex();
      const adapter = new LocalPackageReaderAdapter(createStubParser(index));
      const dipPath = setupDipDir();

      const dips = await collectAll(adapter.readDip(dipPath as any));

      expect(dips).toHaveLength(1);
      expect(dips[0].getUuid()).toBe("dip-uuid-001");
    });
  });

  describe("readDocumentClasses", () => {
    it("should yield one DocumentClass per entry in the index", async () => {
      const index = minimalDiPIndex();
      const adapter = new LocalPackageReaderAdapter(createStubParser(index));
      const dipPath = setupDipDir();

      const classes = await collectAll(
        adapter.readDocumentClasses(dipPath as any),
      );

      expect(classes).toHaveLength(1);
      expect(classes[0].getUuid()).toBe("dc-uuid-001");
      expect(classes[0].getName()).toBe("Fatture");
      expect(classes[0].getTimestamp()).toBe("2024-01-01T00:00:00+01:00");
    });

    it("should yield multiple DocumentClasses when index has many", async () => {
      const index = minimalDiPIndex();
      (index.PackageContent.DiPDocuments.DocumentClass as any[]).push({
        "@_uuid": "dc-uuid-002",
        "@_name": "Contratti",
        "@_version": "1.0",
        "@_validFrom": "2024-06-01T00:00:00+01:00",
        AiP: [],
      });
      const adapter = new LocalPackageReaderAdapter(createStubParser(index));
      const dipPath = setupDipDir();

      const classes = await collectAll(
        adapter.readDocumentClasses(dipPath as any),
      );

      expect(classes).toHaveLength(2);
      expect(classes[1].getUuid()).toBe("dc-uuid-002");
    });
  });

  describe("readProcesses", () => {
    it("should yield one Process per AiP in the index", async () => {
      const index = minimalDiPIndex();
      const adapter = new LocalPackageReaderAdapter(createStubParser(index));
      const dipPath = setupDipDir();

      const processes = await collectAll(adapter.readProcesses(dipPath as any));

      expect(processes).toHaveLength(1);
      expect(processes[0].getUuid()).toBe("aip-uuid-001");
      expect(processes[0].getMetadata()).toEqual([]);
    });
  });

  describe("readDocuments", () => {
    it("should yield one Document per Document entry in AiPs", async () => {
      const index = minimalDiPIndex();
      const adapter = new LocalPackageReaderAdapter(createStubParser(index));
      const dipPath = setupDipDir();

      const docs = await collectAll(adapter.readDocuments(dipPath as any));

      expect(docs).toHaveLength(1);
      expect(docs[0].getUuid()).toBe("doc-uuid-001");
      expect(docs[0].getMetadata()).toEqual([]);
    });
  });

  describe("readFiles", () => {
    it("should yield files with correct isMain flag", async () => {
      const index = minimalDiPIndex();
      const adapter = new LocalPackageReaderAdapter(createStubParser(index));
      const dipPath = setupDipDir();

      const files = await collectAll(adapter.readFiles(dipPath as any));

      expect(files).toHaveLength(2);
      const primary = files.find((f) => f.getFilename() === "fattura.pdf");
      const metadata = files.find((f) => f.getFilename() === "metadata.xml");
      expect(primary).toBeDefined();
      expect(primary!.getIsMain()).toBe(true);
      expect(metadata).toBeDefined();
      expect(metadata!.getIsMain()).toBe(false);
    });

    it("should build correct file paths", async () => {
      const index = minimalDiPIndex();
      const adapter = new LocalPackageReaderAdapter(createStubParser(index));
      const dipPath = setupDipDir();

      const files = await collectAll(adapter.readFiles(dipPath as any));
      const primary = files.find((f) => f.getIsMain());

      expect(primary!.getPath()).toBe(
        "AiP/aip-uuid-001/doc-uuid-001/fattura.pdf",
      );
    });
  });

  describe("readFileBytes", () => {
    it("should return a ReadableStream for an existing file", async () => {
      const index = minimalDiPIndex();
      const adapter = new LocalPackageReaderAdapter(createStubParser(index));
      const filePath = path.join(
        fs.mkdtempSync(path.join(os.tmpdir(), "pkg-reader-bytes-")),
        "test.txt",
      );
      fs.writeFileSync(filePath, "hello world", "utf-8");

      const stream = adapter.readFileBytes(filePath as any);

      expect(stream).toBeInstanceOf(ReadableStream);
      const reader = stream.getReader();
      const { value } = await reader.read();
      const text = new TextDecoder().decode(value);
      expect(text).toBe("hello world");

      fs.rmSync(path.dirname(filePath), { recursive: true });
    });
  });

  describe("caching", () => {
    it("should call parser.parse only once per dipPath", async () => {
      const index = minimalDiPIndex();
      const stubParser = createStubParser(index);
      const adapter = new LocalPackageReaderAdapter(stubParser);
      const dipPath = setupDipDir();

      await collectAll(adapter.readDip(dipPath as any));
      await collectAll(adapter.readDocumentClasses(dipPath as any));
      await collectAll(adapter.readProcesses(dipPath as any));

      expect(stubParser.parse).toHaveBeenCalledTimes(1);
    });

    it("should call parser.parse once per distinct dipPath", async () => {
      const index = minimalDiPIndex();
      const stubParser = createStubParser(index);
      const adapter = new LocalPackageReaderAdapter(stubParser);
      const dipPath1 = setupDipDir();
      const dipPath2 = fs.mkdtempSync(
        path.join(os.tmpdir(), "pkg-reader-test-2-"),
      );
      fs.writeFileSync(path.join(dipPath2, "DiPIndex.xml"), "<stub/>", "utf-8");

      await collectAll(adapter.readDip(dipPath1 as any));
      await collectAll(adapter.readDip(dipPath2 as any));

      expect(stubParser.parse).toHaveBeenCalledTimes(2);

      fs.rmSync(dipPath2, { recursive: true });
    });
  });

  describe("boundary: empty index", () => {
    it("should yield zero processes when no AiPs exist", async () => {
      const index = minimalDiPIndex();
      (index.PackageContent.DiPDocuments.DocumentClass as any[])[0].AiP = [];
      const adapter = new LocalPackageReaderAdapter(createStubParser(index));
      const dipPath = setupDipDir();

      const processes = await collectAll(adapter.readProcesses(dipPath as any));
      expect(processes).toHaveLength(0);
    });

    it("should yield zero documents when no Documents exist in AiPs", async () => {
      const index = minimalDiPIndex();
      (
        index.PackageContent.DiPDocuments.DocumentClass as any[]
      )[0].AiP[0].Document = [];
      const adapter = new LocalPackageReaderAdapter(createStubParser(index));
      const dipPath = setupDipDir();

      const docs = await collectAll(adapter.readDocuments(dipPath as any));
      expect(docs).toHaveLength(0);
    });
  });
});
