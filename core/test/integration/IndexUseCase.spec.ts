import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";

import { IndexDip } from "../../src/use-case/utils/indexing/impl/IndexDip";
import { XmlDipParser } from "../../src/repo/impl/utils/XmlDipParser";
import { FileSystemProvider } from "../../src/repo/impl/utils/FileSystemProvider";
import { LocalPackageReaderAdapter } from "../../src/repo/impl/LocalPackageReaderAdapter";
import { DipRepository } from "../../src/repo/impl/DipRepository";
import { DocumentClassRepository } from "../../src/repo/impl/DocumentClassRepository";
import { ProcessRepository } from "../../src/repo/impl/ProcessRepository";
import { DocumentRepository } from "../../src/repo/impl/DocumentRepository";
import { FileRepository } from "../../src/repo/impl/FileRepository";
import { DatabaseProvider } from "../../src/repo/impl/DatabaseProvider";
import { IntegrityStatusEnum } from "../../src/value-objects/IntegrityStatusEnum";
import { MetadataType } from "../../src/value-objects/Metadata";

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

// ---------------------------------------------------------------------------
// Realistic metadata XML — inspired by the real metadata file.
// Covers: strings, numbers, booleans, nested objects, empty tags.
// ---------------------------------------------------------------------------
const REALISTIC_METADATA_XML = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<Document xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="DocumentMetadata.xsd">
    <DocumentoInformatico>
        <IdDoc>
            <ImprontaCrittograficaDelDocumento>
                <Impronta>nXoAJXHYvtOTVIKTTl7eelix4hlofWdSRIlYpSuqGq8=</Impronta>
                <Algoritmo>SHA-256</Algoritmo>
            </ImprontaCrittograficaDelDocumento>
            <Identificativo>39e0cf29-10d2-40c1-af00-ec098cb8c98a</Identificativo>
        </IdDoc>
        <ModalitaDiFormazione>creazione tramite utilizzo di strumenti software</ModalitaDiFormazione>
        <TipologiaDocumentale>Note Spese</TipologiaDocumentale>
        <DatiDiRegistrazione>
            <TipologiaDiFlusso>U</TipologiaDiFlusso>
            <TipoRegistro>
                <ProtocolloOrdinario_ProtocolloEmergenza>
                    <DataProtocollazioneDocumento>2025-11-11</DataProtocollazioneDocumento>
                    <NumeroProtocolloDocumento>8885588899</NumeroProtocolloDocumento>
                </ProtocolloOrdinario_ProtocolloEmergenza>
            </TipoRegistro>
        </DatiDiRegistrazione>
        <Soggetti>
            <Ruolo>
                <Mittente>
                    <TipoRuolo>Mittente</TipoRuolo>
                    <PF>
                        <Cognome>Mario</Cognome>
                        <Nome>Rossi</Nome>
                    </PF>
                </Mittente>
            </Ruolo>
        </Soggetti>
        <ChiaveDescrittiva>
            <Oggetto>nota spesa X</Oggetto>
        </ChiaveDescrittiva>
        <NumeroAllegati>0</NumeroAllegati>
        <Riservato>false</Riservato>
        <IdentificativoDelFormato>
            <Formato>image/png</Formato>
        </IdentificativoDelFormato>
        <Verifica>
            <FirmatoDigitalmente>false</FirmatoDigitalmente>
            <SigillatoElettronicamente>false</SigillatoElettronicamente>
            <MarcaturaTemporale>false</MarcaturaTemporale>
        </Verifica>
        <NomeDelDocumento>Nota Spesa A</NomeDelDocumento>
        <VersioneDelDocumento>1</VersioneDelDocumento>
        <TempoDiConservazione>5</TempoDiConservazione>
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
    path.join(
      dipPath,
      "DiPIndex.28a27fd3-6787-47ad-8ef5-c14b300309c4.xml",
    ),
    REALISTIC_INDEX_XML,
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
    testHomeDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "dip-index-it-"),
    );
    const mockDipPath = await setupRealisticDip(testHomeDir);
    const dbPath = path.join(testHomeDir, ".dip-viewer", "dip-viewer.db");
    await fs.mkdir(path.dirname(dbPath), { recursive: true });

    dbProvider = new DatabaseProvider(dbPath);
    dbProvider.db.pragma("foreign_keys = OFF");

    const packageReader = new LocalPackageReaderAdapter(
      new XmlDipParser(),
      new FileSystemProvider(),
    );

    dipRepository = new DipRepository(dbProvider);
    documentClassRepository = new DocumentClassRepository(dbProvider);
    processRepository = new ProcessRepository(dbProvider);
    documentRepository = new DocumentRepository(dbProvider);
    fileRepository = new FileRepository(dbProvider);

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
    dbProvider?.db.close();
    await fs.rm(testHomeDir, { recursive: true, force: true });
  });

  // -----------------------------------------------------------------------
  // Structural indexing
  // -----------------------------------------------------------------------

  it("should persist the DIP with the correct UUID", () => {
    const dip = dipRepository.getByUuid(
      "28a27fd3-6787-47ad-8ef5-c14b300309c4",
    );
    expect(dip).not.toBeNull();
    expect(dip?.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
  });

  it("should persist the DocumentClass with name and timestamp", () => {
    const docClasses = documentClassRepository.getByStatus(
      IntegrityStatusEnum.UNKNOWN,
    );
    expect(docClasses).toHaveLength(1);

    const dc = docClasses[0];
    expect(dc.getUuid()).toBe("dc-001");
    expect(dc.getName()).toBe("Note Spese");
    expect(dc.getTimestamp()).toBe("2025-09-24T22:00:00Z");
  });

  it("should persist the Process linked to the DocumentClass", () => {
    const processes = processRepository.getByStatus(
      IntegrityStatusEnum.UNKNOWN,
    );
    expect(processes).toHaveLength(1);
    expect(processes[0].getUuid()).toBe("proc-001");
  });

  it("should persist both documents (with and without metadata)", () => {
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
  });

  it("should persist all files with correct paths and primary flag", () => {
    const files = fileRepository.getByStatus(IntegrityStatusEnum.UNKNOWN);
    expect(files).toHaveLength(3);

    const primary = files.find((f) => f.getFilename() === "Schermata.png");
    expect(primary).toBeDefined();
    expect(primary?.getIsMain()).toBe(true);
    expect(primary?.getPath()).toBe(
      "documents/39e0cf29-10d2-40c1-af00-ec098cb8c98a/Schermata.png",
    );

    const attachment = files.find((f) => f.getFilename() === "allegato1.pdf");
    expect(attachment).toBeDefined();
    expect(attachment?.getIsMain()).toBe(false);

    const noMetaFile = files.find((f) => f.getFilename() === "main.pdf");
    expect(noMetaFile).toBeDefined();
    expect(noMetaFile?.getIsMain()).toBe(true);
  });

  // -----------------------------------------------------------------------
  // Metadata: graceful handling of missing file
  // -----------------------------------------------------------------------

  it("should store empty metadata when the metadata file is missing", () => {
    const documents = documentRepository.getByStatus(
      IntegrityStatusEnum.UNKNOWN,
    );
    const docNoMeta = documents.find((d) => d.getUuid() === "doc-no-meta");
    expect(docNoMeta).toBeDefined();
    expect(docNoMeta?.getMetadata()).toHaveLength(0);
  });

  // -----------------------------------------------------------------------
  // Metadata: comprehensive type coverage
  // -----------------------------------------------------------------------

  describe("metadata type parsing and DB persistence", () => {
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

    it("should parse nested XML objects as STRING metadata (IdDoc, DatiDiRegistrazione, Soggetti, etc.)", () => {
      const metadata = getDocumentMetadata();

      // Nested objects are flattened to their string representation by the parser
      const nestedFields = [
        "IdDoc",
        "DatiDiRegistrazione",
        "Soggetti",
        "ChiaveDescrittiva",
        "IdentificativoDelFormato",
        "Verifica",
      ];

      for (const field of nestedFields) {
        const meta = metadata.find((m) => m.name === field);
        expect(meta, `Expected metadata field '${field}' to exist`).toBeDefined();
        expect(meta?.type).toBe(MetadataType.STRING);
        // Nested objects are stringified — value is non-empty
        expect(meta?.value.length).toBeGreaterThan(0);
      }
    });

    it("should parse plain string values as STRING metadata", () => {
      const metadata = getDocumentMetadata();

      const modalita = metadata.find(
        (m) => m.name === "ModalitaDiFormazione",
      );
      expect(modalita).toBeDefined();
      expect(modalita?.type).toBe(MetadataType.STRING);
      expect(modalita?.value).toBe(
        "creazione tramite utilizzo di strumenti software",
      );

      const tipologia = metadata.find(
        (m) => m.name === "TipologiaDocumentale",
      );
      expect(tipologia).toBeDefined();
      expect(tipologia?.type).toBe(MetadataType.STRING);
      expect(tipologia?.value).toBe("Note Spese");

      const nome = metadata.find((m) => m.name === "NomeDelDocumento");
      expect(nome).toBeDefined();
      expect(nome?.type).toBe(MetadataType.STRING);
      expect(nome?.value).toBe("Nota Spesa A");
    });

    it("should parse numeric values as NUMBER metadata", () => {
      const metadata = getDocumentMetadata();

      const allegati = metadata.find((m) => m.name === "NumeroAllegati");
      expect(allegati).toBeDefined();
      expect(allegati?.type).toBe(MetadataType.NUMBER);
      expect(allegati?.value).toBe("0");

      const versione = metadata.find(
        (m) => m.name === "VersioneDelDocumento",
      );
      expect(versione).toBeDefined();
      expect(versione?.type).toBe(MetadataType.NUMBER);
      expect(versione?.value).toBe("1");

      const conservazione = metadata.find(
        (m) => m.name === "TempoDiConservazione",
      );
      expect(conservazione).toBeDefined();
      expect(conservazione?.type).toBe(MetadataType.NUMBER);
      expect(conservazione?.value).toBe("5");
    });

    it("should parse boolean values as BOOLEAN metadata", () => {
      const metadata = getDocumentMetadata();

      const riservato = metadata.find((m) => m.name === "Riservato");
      expect(riservato).toBeDefined();
      expect(riservato?.type).toBe(MetadataType.BOOLEAN);
      expect(riservato?.value).toBe("false");
    });

    it("should persist metadata to the database and load it back correctly", () => {
      const metadata = getDocumentMetadata();

      // Verify the total count of metadata fields
      // Expected top-level children of DocumentoInformatico:
      //   IdDoc, ModalitaDiFormazione, TipologiaDocumentale,
      //   DatiDiRegistrazione, Soggetti, ChiaveDescrittiva,
      //   NumeroAllegati, Riservato, IdentificativoDelFormato,
      //   Verifica, NomeDelDocumento, VersioneDelDocumento,
      //   TempoDiConservazione
      expect(metadata).toHaveLength(13);

      // Verify that every metadata entry has a non-empty name and type
      for (const m of metadata) {
        expect(m.name.length).toBeGreaterThan(0);
        expect(
          [MetadataType.STRING, MetadataType.NUMBER, MetadataType.BOOLEAN].includes(
            m.type,
          ),
        ).toBe(true);
      }
    });
  });
});
