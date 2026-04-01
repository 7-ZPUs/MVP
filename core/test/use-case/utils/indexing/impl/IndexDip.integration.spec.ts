import { DataMapper } from "../../../../../src/repo/impl/utils/DataMapper";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { IndexDip } from "../../../../../src/use-case/utils/indexing/impl/IndexDip";
import { XmlDipParser } from "../../../../../src/repo/impl/utils/XmlDipParser";
import { FileSystemProvider } from "../../../../../src/repo/impl/utils/FileSystemProvider";
import { LocalPackageReaderAdapter } from "../../../../../src/repo/impl/LocalPackageReaderAdapter";
import { DipRepository } from "../../../../../src/repo/impl/DipRepository";
import { DocumentClassRepository } from "../../../../../src/repo/impl/DocumentClassRepository";
import { ProcessRepository } from "../../../../../src/repo/impl/ProcessRepository";
import { DocumentRepository } from "../../../../../src/repo/impl/DocumentRepository";
import { FileRepository } from "../../../../../src/repo/impl/FileRepository";
import { DatabaseProvider } from "../../../../../src/repo/impl/DatabaseProvider";
import { IntegrityStatusEnum } from "../../../../../src/value-objects/IntegrityStatusEnum";
import { MetadataType } from "../../../../../src/value-objects/Metadata";
import { Document } from "../../../../../src/entity/Document";
import { DipDAO } from "../../../../../src/dao/DipDAO";
import { FileDAO } from "../../../../../src/dao/FileDAO";
import { DocumentClassDAO } from "../../../../../src/dao/DocumentClassDAO";
import { DocumentDAO } from "../../../../../src/dao/DocumentDAO";
import { ProcessDAO } from "../../../../../src/dao/ProcessDAO";
import { readFileSync } from "node:fs";
import { nukeTestDb } from "../../../../dao/helpers/testDb";

// ---------------------------------------------------------------------------
// Realistic DiP index XML — one DocumentClass, one AiP, two Documents
// ---------------------------------------------------------------------------
const REALISTIC_INDEX_XML = `<?xml version="1.0" encoding="UTF-8"?>
<DiPIndex>
  <PackageInfo>
    <ProcessUUID>28a27fd3-6787-47ad-8ef5-c14b300309c4</ProcessUUID>
  </PackageInfo>
  <PackageContent>
    <DiPDocuments>
      <DocumentClass uuid="dc-001" name="Note Spese" validFrom="2025-09-24T22:00:00Z">
        <AiP uuid="proc-001">
          <AiPRoot>documents</AiPRoot>
          <Document uuid="39e0cf29-10d2-40c1-af00-ec098cb8c98a">
            <DocumentPath>documents/39e0cf29-10d2-40c1-af00-ec098cb8c98a</DocumentPath>
            <Files>
              <Metadata uuid="meta-001">39e0cf29.metadata.xml</Metadata>
              <Primary uuid="file-001">Schermata.png</Primary>
              <Attachments uuid="file-002">allegato1.pdf</Attachments>
            </Files>
          </Document>
          <Document uuid="doc-no-meta">
            <DocumentPath>documents/doc-no-meta</DocumentPath>
            <Files>
              <Metadata uuid="meta-002">missing.metadata.xml</Metadata>
              <Primary uuid="file-003">main.pdf</Primary>
            </Files>
          </Document>
        </AiP>
      </DocumentClass>
    </DiPDocuments>
  </PackageContent>
</DiPIndex>`;

const REALISTIC_AIPINFO_XML = `
<AiPInfo>
<simpleField>simple value</simpleField>
<compositeField>
  <compositeChild>
    <child>value1</child>
  </compositeChild>
  <child name="child2">value2</child>
</compositeField>
</AiPInfo>
`;

// ---------------------------------------------------------------------------
// Realistic metadata XML — inspired by the real metadata file.
// Covers: strings, numbers, booleans, nested objects, empty tags.
// ---------------------------------------------------------------------------
const REALISTIC_METADATA_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<Document xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="DocumentMetadata.xsd">
    <DocumentoInformatico>
        <IdDoc>
            <ImprontaCrittograficaDelDocumento>
                <Impronta>primary-hash</Impronta>
                <Algoritmo>SHA-256</Algoritmo>
            </ImprontaCrittograficaDelDocumento>
            <Identificativo>file-001</Identificativo>
        </IdDoc>
        <Allegati>
          <IndiceAllegati>
                <NumeroAllegati>1</NumeroAllegati>
                <IdDoc>
                    <ImprontaCrittograficaDelDocumento>
                        <Impronta>file-002-hash</Impronta>
                        <Algoritmo>SHA-256</Algoritmo>
                    </ImprontaCrittograficaDelDocumento>
                    <Identificativo>file-002</Identificativo>
                </IdDoc>
                <Descrizione>Descrizione allegato 7</Descrizione>
          </IndiceAllegati>
        </Allegati>
        <example>
          <simpleField>simple value</simpleField>
          <compositeField>
            <compositeChild>
             <child>value1</child>
            </compositeChild>
            <child>true</child>
          </compositeField>
        </example>
    </DocumentoInformatico>
</Document>`;

// ---------------------------------------------------------------------------
// FS helper — creates a minimal DiP folder with the above XMLs
// ---------------------------------------------------------------------------
async function setupRealisticDip(baseDir: string): Promise<string> {
  const dipPath = path.join(baseDir, "realistic_dip");
  await fs.mkdir(dipPath, { recursive: true });

  // Index file
  await fs.writeFile(
    path.join(dipPath, "DiPIndex.28a27fd3-6787-47ad-8ef5-c14b300309c4.xml"),
    REALISTIC_INDEX_XML,
  );

  // Process metadata
  await fs.mkdir(path.join(dipPath, "documents"), { recursive: true });
  await fs.writeFile(
    path.join(dipPath, "documents", "AiPInfo.proc-001.xml"),
    REALISTIC_AIPINFO_XML,
    "utf-8",
  );

  // Document with metadata
  const docDir = path.join(
    dipPath,
    "documents",
    "39e0cf29-10d2-40c1-af00-ec098cb8c98a",
  );
  await fs.mkdir(docDir, { recursive: true });
  await fs.writeFile(
    path.join(docDir, "39e0cf29.metadata.xml"),
    REALISTIC_METADATA_XML,
  );

  // doc-no-meta — directory exists but metadata file is intentionally missing
  await fs.mkdir(path.join(dipPath, "documents", "doc-no-meta"), {
    recursive: true,
  });

  return dipPath;
}

// ---------------------------------------------------------------------------
// Integration test suite
// ---------------------------------------------------------------------------
describe("Index use-case integration tests", () => {
  let testHomeDir: string;
  let dbProvider: DatabaseProvider;
  let dipRepository: DipRepository;
  let documentClassRepository: DocumentClassRepository;
  let processRepository: ProcessRepository;
  let documentRepository: DocumentRepository;
  let fileRepository: FileRepository;

  beforeAll(async () => {
    testHomeDir = await fs.mkdtemp(path.join(os.tmpdir(), "dip-index-it-"));
    const mockDipPath = await setupRealisticDip(testHomeDir);
    const dbPath = path.join(testHomeDir, ".dip-viewer", "dip-viewer.db");
    await fs.mkdir(path.dirname(dbPath), { recursive: true });

    dbProvider = new DatabaseProvider(dbPath);
    const schema = readFileSync("db/schema.sql", "utf-8");
    nukeTestDb(dbProvider.getDb());
    dbProvider.getDb().exec(schema);

    const packageReader = new LocalPackageReaderAdapter(
      new XmlDipParser(),
      new FileSystemProvider(),
      new DataMapper(),
    );

    dipRepository = new DipRepository(new DipDAO(dbProvider));
    documentClassRepository = new DocumentClassRepository(
      new DocumentClassDAO(dbProvider),
    );

    processRepository = new ProcessRepository(new ProcessDAO(dbProvider));
    documentRepository = new DocumentRepository(new DocumentDAO(dbProvider));
    fileRepository = new FileRepository(new FileDAO(dbProvider));

    const useCase = new IndexDip(
      packageReader,
      dipRepository,
      documentClassRepository,
      processRepository,
      documentRepository,
      fileRepository,
    );

    const result = await useCase.execute(mockDipPath);
    expect(result.success).toBe(true);
  });

  afterAll(async () => {
    dbProvider?.getDb().close();
    await fs.rm(testHomeDir, { recursive: true, force: true });
  });

  // -----------------------------------------------------------------------
  // Structural indexing
  // -----------------------------------------------------------------------

  // identifier: TU-F-Indexing-15
  // method_name: execute()
  // description: should persist the DIP with the correct UUID
  // expected_value: matches asserted behavior: persist the DIP with the correct UUID
  it("TU-F-Indexing-15: execute() should persist the DIP with the correct UUID", () => {
    const dip = dipRepository.getByUuid("28a27fd3-6787-47ad-8ef5-c14b300309c4");
    expect(dip).not.toBeNull();
    expect(dip?.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
  });

  // identifier: TU-F-Indexing-16
  // method_name: execute()
  // description: should persist the DocumentClass with name and timestamp
  // expected_value: matches asserted behavior: persist the DocumentClass with name and timestamp
  it("TU-F-Indexing-16: execute() should persist the DocumentClass with name and timestamp", () => {
    const docClasses = documentClassRepository.getByStatus(
      IntegrityStatusEnum.UNKNOWN,
    );
    expect(docClasses).toHaveLength(1);

    const dc = docClasses[0];
    expect(dc.getUuid()).toBe("dc-001");
    expect(dc.getName()).toBe("Note Spese");
    expect(dc.getTimestamp()).toBe("2025-09-24T22:00:00Z");
  });

  // identifier: TU-F-Indexing-17
  // method_name: execute()
  // description: should persist the Process linked to the DocumentClass
  // expected_value: matches asserted behavior: persist the Process linked to the DocumentClass
  it("TU-F-Indexing-17: execute() should persist the Process linked to the DocumentClass", () => {
    const processes = processRepository.getByStatus(
      IntegrityStatusEnum.UNKNOWN,
    );
    expect(processes).toHaveLength(1);
    const process = processes[0];
    expect(process.getUuid()).toBe("proc-001");

    const metadata = process.getMetadata();

    const root = metadata;
    expect(root.getName()).toBe("AiPInfo");
    expect(root.getType()).toBe(MetadataType.COMPOSITE);

    const rootChildren = root.getChildren();
    expect(rootChildren).toHaveLength(2);

    const simpleField = rootChildren.find((m) => m.getName() === "simpleField");
    expect(simpleField).toBeDefined();
    expect(simpleField?.getType()).toBe(MetadataType.STRING);
    expect(simpleField?.getStringValue()).toBe("simple value");

    const compositeField = rootChildren.find(
      (m) => m.getName() === "compositeField",
    );
    expect(compositeField).toBeDefined();
    expect(compositeField?.getType()).toBe(MetadataType.COMPOSITE);

    const compositeChildren = compositeField?.getChildren() ?? [];
    expect(compositeChildren).toHaveLength(2);

    const compositeChild = compositeChildren.find(
      (m) => m.getName() === "compositeChild",
    );
    expect(compositeChild).toBeDefined();
    expect(compositeChild?.getType()).toBe(MetadataType.COMPOSITE);
    expect(compositeChild?.getChildren()).toHaveLength(1);
    expect(compositeChild?.getChildren()[0].getName()).toBe("child");
    expect(compositeChild?.getChildren()[0].getStringValue()).toBe("value1");

    const childWithAttribute = compositeChildren.find(
      (m) => m.getName() === "child",
    );
    expect(childWithAttribute).toBeDefined();
    expect(childWithAttribute?.getType()).toBe(MetadataType.COMPOSITE);

    const childWithAttributeChildren = childWithAttribute?.getChildren() ?? [];
    const nameAttr = childWithAttributeChildren.find(
      (m) => m.getName() === "@_name",
    );
    expect(nameAttr).toBeDefined();
    expect(nameAttr?.getStringValue()).toBe("child2");

    const textNode = childWithAttributeChildren.find(
      (m) => m.getName() === "#text",
    );
    expect(textNode).toBeDefined();
    expect(textNode?.getStringValue()).toBe("value2");
  });

  // identifier: TU-F-Indexing-18
  // method_name: execute()
  // description: should persist both documents (with and without metadata)
  // expected_value: matches asserted behavior: persist both documents (with and without metadata)
  it("TU-F-Indexing-18: execute() should persist both documents (with and without metadata)", () => {
    const documents = documentRepository.getByStatus(
      IntegrityStatusEnum.UNKNOWN,
    );
    expect(documents).toHaveLength(2);
    expect(
      documents.some(
        (d) => d.getUuid() === "39e0cf29-10d2-40c1-af00-ec098cb8c98a",
      ),
    ).toBe(true);
    expect(documents.some((d) => d.getUuid() === "doc-no-meta")).toBe(true);

    const documentWithMeta = documents.find(
      (d) => d.getUuid() === "39e0cf29-10d2-40c1-af00-ec098cb8c98a",
    );
    expect(documentWithMeta).toBeDefined();
    const metadata = (documentWithMeta as unknown as Document).getMetadata();
    expect(metadata).toBeDefined();
    expect(metadata.getChildren()).toHaveLength(3); // IdDoc, Allegati, example
    expect(metadata.getChildren()[2].getName()).toBe("example");
    expect(metadata.getChildren()[2].getType()).toBe(MetadataType.COMPOSITE);
    expect(metadata.getChildren()[2].getChildren()).toHaveLength(2);

    //Simple value validation

    expect(metadata.getChildren()[2].getChildren()[0].getName()).toBe(
      "simpleField",
    );
    expect(metadata.getChildren()[2].getChildren()[0].getStringValue()).toBe(
      "simple value",
    );

    //Composite value validation

    const compositeField = metadata.getChildren()[2].getChildren()[1];
    expect(compositeField.getName()).toBe("compositeField");
    expect(compositeField.getType()).toBe(MetadataType.COMPOSITE);
    const compositeChildren = compositeField.getChildren();
    expect(compositeChildren).toHaveLength(2);

    const compositeChild = compositeChildren.find(
      (m) => m.getName() === "compositeChild",
    );
    expect(compositeChild).toBeDefined();
    expect(compositeChild?.getType()).toBe(MetadataType.COMPOSITE);
    expect(compositeChild?.getChildren()).toHaveLength(1);
    expect(compositeChild?.getChildren()[0].getName()).toBe("child");
    expect(compositeChild?.getChildren()[0].getStringValue()).toBe("value1");

    const childWithAttribute = compositeChildren.find(
      (m) => m.getName() === "child",
    );
    expect(childWithAttribute).toBeDefined();
    expect(childWithAttribute?.getType()).toBe(MetadataType.BOOLEAN);
    expect(childWithAttribute?.getStringValue()).toBe("true");
  });

  // identifier: TU-F-Indexing-19
  // method_name: execute()
  // description: should persist all files with correct paths and primary flag
  // expected_value: matches asserted behavior: persist all files with correct paths and primary flag
  it("TU-F-Indexing-19: execute() should persist all files with correct paths and primary flag", () => {
    const files = fileRepository.getByStatus(IntegrityStatusEnum.UNKNOWN);
    expect(files).toHaveLength(3);

    const primary = files.find((f) => f.getFilename() === "Schermata.png");
    expect(primary).toBeDefined();
    expect(primary?.getIsMain()).toBe(true);
    expect(primary?.getHash()).toBe("primary-hash");
    expect(primary?.getPath()).toBe(
      "documents/39e0cf29-10d2-40c1-af00-ec098cb8c98a/Schermata.png",
    );

    const attachment = files.find((f) => f.getFilename() === "allegato1.pdf");
    expect(attachment).toBeDefined();
    expect(attachment?.getIsMain()).toBe(false);
    expect(attachment?.getHash()).toBe("file-002-hash");
    expect(attachment?.getPath()).toBe(
      "documents/39e0cf29-10d2-40c1-af00-ec098cb8c98a/allegato1.pdf",
    );

    const noMetaFile = files.find((f) => f.getFilename() === "main.pdf");
    expect(noMetaFile).toBeDefined();
    expect(noMetaFile?.getIsMain()).toBe(true);
    expect(noMetaFile?.getHash()).toBe("");
    expect(noMetaFile?.getPath()).toBe("documents/doc-no-meta/main.pdf");
  });

  // -----------------------------------------------------------------------
  // Metadata: graceful handling of missing file
  // -----------------------------------------------------------------------

  // identifier: TU-F-Indexing-20
  // method_name: execute()
  // description: should store empty metadata when the metadata file is missing
  // expected_value: matches asserted behavior: store empty metadata when the metadata file is missing
  it("TU-F-Indexing-20: execute() should store empty metadata when the metadata file is missing", () => {
    const documents = documentRepository.getByStatus(
      IntegrityStatusEnum.UNKNOWN,
    );
    const docNoMeta = documents.find((d) => d.getUuid() === "doc-no-meta");
    expect(docNoMeta).toBeDefined();
    expect(docNoMeta?.getMetadata().getChildren()).toHaveLength(0);
  });

  // -----------------------------------------------------------------------
  // Metadata: comprehensive type coverage
  // -----------------------------------------------------------------------

  function getDocumentMetadata() {
    const documents = documentRepository.getByStatus(
      IntegrityStatusEnum.UNKNOWN,
    );
    const doc = documents.find(
      (d) => d.getUuid() === "39e0cf29-10d2-40c1-af00-ec098cb8c98a",
    );
    expect(doc).toBeDefined();
    return doc!.getMetadata();
  }

  describe("metadata type parsing and DB persistence", () => {
    // identifier: TU-F-Indexing-21
    // method_name: execute()
    // description: should parse nested XML objects as COMPOSITE metadata (IdDoc, DatiDiRegistrazione, Soggetti, etc.)
    // expected_value: matches asserted behavior: parse nested XML objects as COMPOSITE metadata (IdDoc, DatiDiRegistrazione, Soggetti, etc.)
    it("TU-F-Indexing-21: execute() should parse nested XML objects as COMPOSITE metadata (IdDoc, DatiDiRegistrazione, Soggetti, etc.)", () => {
      const metadata = getDocumentMetadata();

      // Nested objects are parsed into arrays
      const nestedFields = ["IdDoc", "Allegati", "example"];

      for (const field of nestedFields) {
        const meta = metadata.findNodeByName(field);
        expect(
          meta,
          `Expected metadata field '${field}' to exist`,
        ).toBeDefined();
        expect(meta?.getType()).toBe(MetadataType.COMPOSITE);
        // Nested objects are arrays
        expect(meta?.getType()).toBe(MetadataType.COMPOSITE);
      }
    });

    // identifier: TU-F-Indexing-22
    // method_name: execute()
    // description: should parse plain string values as STRING metadata
    // expected_value: matches asserted behavior: parse plain string values as STRING metadata
    it("TU-F-Indexing-22: execute() should parse plain string values as STRING metadata", () => {
      const metadata = getDocumentMetadata();

      const modalita = metadata.findNodeByName("simpleField");
      expect(modalita).toBeDefined();
      expect(modalita?.getType()).toBe(MetadataType.STRING);
      expect(modalita?.getStringValue()).toBe("simple value");
    });

    // identifier: TU-F-Indexing-23
    // method_name: execute()
    // description: should parse numeric values as NUMBER metadata
    // expected_value: matches asserted behavior: parse numeric values as NUMBER metadata
    it("TU-F-Indexing-23: execute() should parse numeric values as NUMBER metadata", () => {
      const metadata = getDocumentMetadata();

      const allegati = metadata.findNodeByName("NumeroAllegati");
      expect(allegati).toBeDefined();
      expect(allegati?.getType()).toBe(MetadataType.NUMBER);
      expect(allegati?.getStringValue()).toBe("1");
    });

    // identifier: TU-F-Indexing-24
    // method_name: execute()
    // description: should parse boolean values as BOOLEAN metadata
    // expected_value: matches asserted behavior: parse boolean values as BOOLEAN metadata
    it("TU-F-Indexing-24: execute() should parse boolean values as BOOLEAN metadata", () => {
      const metadata = getDocumentMetadata();

      const childBool = metadata
        .findNodeByName("compositeField")
        ?.getChildren()[1];
      expect(childBool).toBeDefined();
      expect(childBool?.getType()).toBe(MetadataType.BOOLEAN);
      expect(childBool?.getStringValue()).toBe("true");
    });

    // identifier: TU-F-Indexing-25
    // method_name: execute()
    // description: should persist metadata to the database and load it back correctly
    // expected_value: matches asserted behavior: persist metadata to the database and load it back correctly
    it("TU-F-Indexing-25: execute() should persist metadata to the database and load it back correctly", () => {
      const metadata = getDocumentMetadata();

      // Verify the total count of metadata fields
      // Expected top-level children of DocumentoInformatico:
      //   IdDoc, ModalitaDiFormazione, TipologiaDocumentale,
      //   DatiDiRegistrazione, Soggetti, ChiaveDescrittiva,
      //   NumeroAllegati, Riservato, IdentificativoDelFormato,
      //   Verifica, NomeDelDocumento, VersioneDelDocumento,
      //   TempoDiConservazione
      expect(metadata.getChildren()).toHaveLength(3);

      // Verify that every metadata entry has a non-empty name and type
      for (const m of metadata.getChildren()) {
        expect(m.getName().length).toBeGreaterThan(0);
        expect(
          [
            MetadataType.STRING,
            MetadataType.NUMBER,
            MetadataType.BOOLEAN,
            MetadataType.COMPOSITE,
          ].includes(m.getType()),
        ).toBe(true);
      }
    });
  });
});
