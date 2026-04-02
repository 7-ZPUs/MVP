import { DataMapper } from "../../../../../src/repo/impl/utils/DataMapper";
import Database from "better-sqlite3";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { IndexDip } from "../../../../../src/use-case/utils/indexing/impl/IndexDip";
import { DipRepository } from "../../../../../src/repo/impl/DipRepository";
import { DocumentClassRepository } from "../../../../../src/repo/impl/DocumentClassRepository";
import { ProcessRepository } from "../../../../../src/repo/impl/ProcessRepository";
import { DocumentRepository } from "../../../../../src/repo/impl/DocumentRepository";
import { FileRepository } from "../../../../../src/repo/impl/FileRepository";
import { LocalPackageReaderAdapter } from "../../../../../src/repo/impl/LocalPackageReaderAdapter";
import { XmlDipParser } from "../../../../../src/repo/impl/utils/XmlDipParser";
import { IFileSystemProvider } from "../../../../../src/repo/impl/utils/IFileSystemProvider";
import { DipDAO } from "../../../../../src/dao/DipDAO";
import { DocumentClassDAO } from "../../../../../src/dao/DocumentClassDAO";
import { ProcessDAO } from "../../../../../src/dao/ProcessDAO";
import { DocumentDAO } from "../../../../../src/dao/DocumentDAO";
import { FileDAO } from "../../../../../src/dao/FileDAO";
import { readFileSync } from "node:fs";

describe("IndexDip", () => {
  let db: Database.Database;
  let fileSystemProvider: IFileSystemProvider;
  let useCase: IndexDip;

  beforeEach(() => {
    db = new Database(":memory:");
    const schema = readFileSync("db/schema.sql", "utf-8");
    db.exec(schema);

    const dipRepository = new DipRepository(new DipDAO(db));
    const documentClassRepository = new DocumentClassRepository(
      new DocumentClassDAO(db),
    );
    const processRepository = new ProcessRepository(new ProcessDAO(db));
    const documentRepository = new DocumentRepository(new DocumentDAO(db));
    const fileRepository = new FileRepository(new FileDAO(db));

    const parser = new XmlDipParser();
    fileSystemProvider = {
      readFile: vi.fn(),
      openReadStream: vi.fn(),
      readTextFile: vi.fn(),
      fileExists: vi.fn(),
      listFiles: vi.fn(),
    };

    const packageReader = new LocalPackageReaderAdapter(
      parser,
      fileSystemProvider,
      new DataMapper(),
    );

    useCase = new IndexDip(
      packageReader,
      dipRepository,
      documentClassRepository,
      processRepository,
      documentRepository,
      fileRepository,
    );
  });

  // identifier: TU-F-Indexing-27
  // method_name: execute()
  // description: should orchestrate reader and repository writes parsing real XML
  // expected_value: returns { success: true } and persists dip, document class, process, document, metadata and file records
  it("TU-F-Indexing-27: execute() should orchestrate reader and repository writes parsing real XML", async () => {
    const dipPath = "/dip/path";

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

    const documentMetadata = db
      .prepare("SELECT * FROM document_metadata")
      .all();
    expect(documentMetadata.length).toBeGreaterThan(0);
    const titoloRow = (documentMetadata as any[]).find(
      (m) => m.name === "Titolo",
    );
    expect(titoloRow?.value).toBe("Test Titolo");

    const files = db.prepare("SELECT * FROM file").all();
    expect(files).toHaveLength(1);
    expect((files[0] as any).filename).toBe("./primary.pdf");
  });

  // identifier: TU-F-Indexing-28
  // method_name: execute()
  // description: should throw on structurally invalid empty files and avoid persistence
  // expected_value: throws an error and keeps dip and document_class tables empty
  it("TU-F-Indexing-28: execute() should throw on structurally invalid empty files and avoid persistence", async () => {
    const dipPath = "empty/dip/path";

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
});
