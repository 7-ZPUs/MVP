import { DataMapper } from "../../../../../src/repo/impl/utils/DataMapper";
import Database from "better-sqlite3";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { IndexDipUC } from "../../../../../src/use-case/utils/indexing/impl/IndexDip";
import { DipPersistenceAdapter } from "../../../../../src/repo/impl/DipPersistenceAdapter";
import { DocumentClassPersistenceAdapter } from "../../../../../src/repo/impl/DocumentClassPersistenceAdapter";
import { ProcessPersistenceAdapter } from "../../../../../src/repo/impl/ProcessPersistenceAdapter";
import { DocumentPersistenceAdapter } from "../../../../../src/repo/impl/DocumentPersistenceAdapter";
import { FilePersistenceAdapter } from "../../../../../src/repo/impl/FilePersistenceAdapter";
import { PackageReaderService } from "../../../../../src/services/impl/PackageReaderService";
import { XmlDipParser } from "../../../../../src/repo/impl/utils/XmlDipParser";
import { IFileSystemPort } from "../../../../../src/repo/impl/utils/IFileSystemProvider";
import { DipDAO } from "../../../../../src/dao/DipDAO";
import { DocumentClassDAO } from "../../../../../src/dao/DocumentClassDAO";
import { ProcessDAO } from "../../../../../src/dao/ProcessDAO";
import { DocumentDAO } from "../../../../../src/dao/DocumentDAO";
import { FileDAO } from "../../../../../src/dao/FileDAO";
import { readFileSync } from "node:fs";
import { SqliteTransactionManager } from "../../../../../src/repo/impl/SqliteTransactionManager";
import { ISaveVectorPort } from "../../../../../src/repo/IVectorRepository";
import { IEmbeddingService } from "../../../../../src/services/IEmbeddingService";
import { Vector } from "../../../../../src/entity/Vector";
import { container } from "tsyringe";

describe("IndexDip", () => {
  let db: Database.Database;
  let fileSystemProvider: IFileSystemPort;
  let useCase: IndexDipUC;
  let vectorRepository: ISaveVectorPort;
  let embeddingService: IEmbeddingService;

  beforeEach(() => {
    container.registerInstance("DIP_PATH_TOKEN", "");

    db = new Database(":memory:");
    const schema = readFileSync("db/schema.sql", "utf-8");
    db.exec(schema);

    const dipRepository = new DipPersistenceAdapter(new DipDAO(db));
    const documentClassRepository = new DocumentClassPersistenceAdapter(
      new DocumentClassDAO(db),
    );
    const processRepository = new ProcessPersistenceAdapter(new ProcessDAO(db));
    const documentRepository = new DocumentPersistenceAdapter(
      new DocumentDAO(db),
    );
    const fileRepository = new FilePersistenceAdapter(new FileDAO(db));
    vectorRepository = {
      saveVector: vi.fn().mockResolvedValue(undefined),
    };
    embeddingService = {
      generateDocumentEmbedding: vi.fn().mockResolvedValue(null),
      setEmbeddingConfiguration: vi.fn(),
    };

    const parser = new XmlDipParser();
    fileSystemProvider = {
      readFile: vi.fn(),
      openReadStream: vi.fn(),
      readTextFile: vi.fn(),
      fileExists: vi.fn(),
      listFiles: vi.fn(),
    };

    const packageReader = new PackageReaderService(
      parser,
      fileSystemProvider,
      new DataMapper(),
    );

    useCase = new IndexDipUC(
      packageReader,
      dipRepository,
      documentClassRepository,
      processRepository,
      documentRepository,
      fileRepository,
      vectorRepository,
      embeddingService,
      new SqliteTransactionManager(db),
    );
  });

  // identifier: TU-F-Indexing-27
  // method_name: execute()
  // description: should orchestrate reader and repository writes parsing real XML
  // expected_value: returns { success: true } and persists dip, document class, process, document, metadata and file records
  it("TU-F-Indexing-27: execute() should orchestrate reader and repository writes parsing real XML", async () => {
    const dipPath = "/dip/path";
    container.registerInstance("DIP_PATH_TOKEN", dipPath);

    vi.mocked(embeddingService.generateDocumentEmbedding).mockResolvedValue(
      new Float32Array([0.1, 0.2]),
    );

    vi.mocked(fileSystemProvider.listFiles).mockResolvedValue([
      "DiPIndex.test-dip-uuid-1234.xml",
    ]);

    vi.mocked(fileSystemProvider.readTextFile).mockImplementation(
      async (filePath) => {
        if (filePath.includes("DiPIndex")) {
          return `<?xml version="1.0" encoding="UTF-8"?>
          <DiPIndex>
            <PackageInfo>
              <ProcessUUID>dip-uuid-1</ProcessUUID>
            </PackageInfo>
            <PackageContent>
              <DiPDocuments>
                <DocumentClass name="Class1" uuid="dc-1" validFrom="2026-01-01T00:00:00Z">
                  <AiP uuid="proc-1">
                    <AiPRoot>./dc-1/proc-1</AiPRoot>
                    <Document uuid="doc-1">
                      <DocumentPath>./dc-1/proc-1/doc-1</DocumentPath>
                      <Files FilesCount="2">
                        <Metadata uuid="meta-1">./meta.xml</Metadata>
                        <Primary uuid="prim-1">./primary.pdf</Primary>
                      </Files>
                    </Document>
                  </AiP>
                </DocumentClass>
              </DiPDocuments>
            </PackageContent>
          </DiPIndex>`;
        }
        if (filePath.includes("AiPInfo.xml")) {
          return `<AiPInfo><ProcessData><SessionId>session-123</SessionId></ProcessData></AiPInfo>`;
        }
        if (filePath.includes("meta.xml")) {
          return `<Document><DocumentoInformatico><IdDoc><ImprontaCrittograficaDelDocumento><Impronta>testHash=</Impronta><Algoritmo>SHA-256</Algoritmo></ImprontaCrittograficaDelDocumento><Identificativo>prim-1</Identificativo></IdDoc><Titolo>Test Titolo</Titolo></DocumentoInformatico></Document>`;
        }
        return "";
      },
    );

    const result = await useCase.execute(dipPath);
    expect(result).toEqual({ success: true });

    const dips = db.prepare("SELECT * FROM dip").all();
    expect(dips).toHaveLength(1);
    expect((dips[0] as any).uuid).toBe("dip-uuid-1");

    const docClasses = db.prepare("SELECT * FROM document_class").all();
    expect(docClasses).toHaveLength(1);
    expect((docClasses[0] as any).uuid).toBe("dc-1");

    const processes = db.prepare("SELECT * FROM process").all();
    expect(processes).toHaveLength(1);
    expect((processes[0] as any).uuid).toBe("proc-1");

    const documents = db.prepare("SELECT * FROM document").all();
    expect(documents).toHaveLength(1);
    expect((documents[0] as any).uuid).toBe("doc-1");

    const files = db.prepare("SELECT * FROM file").all();
    expect(files).toHaveLength(1);
    expect((files[0] as any).filename).toBe("./primary.pdf");

    expect(embeddingService.generateDocumentEmbedding).toHaveBeenCalledTimes(1);
    const [calledFile] = vi.mocked(embeddingService.generateDocumentEmbedding)
      .mock.calls[0];
    expect(calledFile.getPath()).toContain("primary.pdf");
    expect(vectorRepository.saveVector).toHaveBeenCalledTimes(1);
    expect(vectorRepository.saveVector).toHaveBeenCalledWith(
      expect.any(Vector),
    );
  });

  // identifier: TU-F-Indexing-28
  // method_name: execute()
  // description: should throw on structurally invalid empty files and avoid persistence
  // expected_value: throws an error and keeps dip and document_class tables empty
  it("TU-F-Indexing-28: execute() should throw on structurally invalid empty files and avoid persistence", async () => {
    const dipPath = "empty/dip/path";
    container.registerInstance("DIP_PATH_TOKEN", dipPath);

    vi.mocked(fileSystemProvider.listFiles).mockResolvedValue([
      "DiPIndex.empty.xml",
    ]);

    vi.mocked(fileSystemProvider.readTextFile)
      .mockResolvedValue(`<?xml version="1.0" encoding="UTF-8"?>
      <DiPIndex>
        <PackageInfo>
          <ProcessUUID>dip-empty</ProcessUUID>
        </PackageInfo>
        <PackageContent>
          <DiPDocuments>
          </DiPDocuments>
        </PackageContent>
      </DiPIndex>`);

    await expect(useCase.execute(dipPath)).rejects.toThrow();

    // Verify nothing got saved because it threw at the parser level
    const dips = db.prepare("SELECT * FROM dip").all();
    expect(dips).toHaveLength(0);
    const docClasses = db.prepare("SELECT * FROM document_class").all();
    expect(docClasses).toHaveLength(0);
  });

  // identifier: TU-F-Indexing-29
  // method_name: execute()
  // description: should continue indexing when vector generation fails for main files
  // expected_value: returns success, persists file records, and does not persist vectors
  it("TU-F-Indexing-29: execute() should continue indexing when vector generation fails", async () => {
    const dipPath = "/dip/path";
    container.registerInstance("DIP_PATH_TOKEN", dipPath);

    vi.mocked(embeddingService.generateDocumentEmbedding).mockRejectedValue(
      new Error("missing model file"),
    );

    vi.mocked(fileSystemProvider.listFiles).mockResolvedValue([
      "DiPIndex.test-dip-uuid-1234.xml",
    ]);

    vi.mocked(fileSystemProvider.readTextFile).mockImplementation(
      async (filePath) => {
        if (filePath.includes("DiPIndex")) {
          return `<?xml version="1.0" encoding="UTF-8"?>
          <DiPIndex>
            <PackageInfo>
              <ProcessUUID>dip-uuid-1</ProcessUUID>
            </PackageInfo>
            <PackageContent>
              <DiPDocuments>
                <DocumentClass name="Class1" uuid="dc-1" validFrom="2026-01-01T00:00:00Z">
                  <AiP uuid="proc-1">
                    <AiPRoot>./dc-1/proc-1</AiPRoot>
                    <Document uuid="doc-1">
                      <DocumentPath>./dc-1/proc-1/doc-1</DocumentPath>
                      <Files FilesCount="2">
                        <Metadata uuid="meta-1">./meta.xml</Metadata>
                        <Primary uuid="prim-1">./primary.pdf</Primary>
                      </Files>
                    </Document>
                  </AiP>
                </DocumentClass>
              </DiPDocuments>
            </PackageContent>
          </DiPIndex>`;
        }
        if (filePath.includes("AiPInfo.xml")) {
          return `<AiPInfo><ProcessData><SessionId>session-123</SessionId></ProcessData></AiPInfo>`;
        }
        if (filePath.includes("meta.xml")) {
          return `<Document><DocumentoInformatico><IdDoc><ImprontaCrittograficaDelDocumento><Impronta>testHash=</Impronta><Algoritmo>SHA-256</Algoritmo></ImprontaCrittograficaDelDocumento><Identificativo>prim-1</Identificativo></IdDoc><Titolo>Test Titolo</Titolo></DocumentoInformatico></Document>`;
        }
        return "";
      },
    );

    const result = await useCase.execute(dipPath);
    expect(result).toEqual({ success: true });

    const files = db.prepare("SELECT * FROM file").all();
    expect(files).toHaveLength(1);
    expect(embeddingService.generateDocumentEmbedding).toHaveBeenCalledTimes(1);
    expect(vectorRepository.saveVector).not.toHaveBeenCalled();
  });
});
