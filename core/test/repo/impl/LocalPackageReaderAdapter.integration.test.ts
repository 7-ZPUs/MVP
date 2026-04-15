import { DataMapper } from "../../../src/repo/impl/utils/DataMapper";
import * as os from "node:os";
import * as path from "node:path";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { container } from "tsyringe";
import { PackageReaderService } from "../../../src/services/impl/PackageReaderService";
import { XmlDipParser } from "../../../src/repo/impl/utils/XmlDipParser";
import { FileSystemPort } from "../../../src/repo/impl/utils/FileSystemProvider";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";
import { Metadata, MetadataType } from "../../../src/value-objects/Metadata";

const RESOURCES_DIR = "core/test/resources";
const DIP_INDEX_FILE = "DiPIndex.123e4567-e89b-12d3-a456-426614174000.xml";

async function createSampleDipPackageFromResources(): Promise<string> {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "dip-package-it-"));

  const dipIndexContent = await readFile(
    path.join(RESOURCES_DIR, "dipindex_test.xml"),
    "utf-8",
  );
  const metadataContent = await readFile(
    path.join(RESOURCES_DIR, "metadata_test.xml"),
    "utf-8",
  );
  const sampleFileContent = await readFile(
    path.join(RESOURCES_DIR, "sample.txt"),
  );

  await writeFile(path.join(tempDir, DIP_INDEX_FILE), dipIndexContent, "utf-8");

  const documents = [
    {
      basePath: "./class-1/aip-1/documents/doc-1",
      metadataFilename: "./meta.xml",
      files: ["./primary.pdf"],
    },
    {
      basePath: "./class-2/aip-2/documents/doc-2",
      metadataFilename: "./meta2.xml",
      files: ["./primary2.pdf", "./att1.pdf", "./att2.pdf"],
    },
    {
      basePath: "./class-2/aip-3/documents/doc-3",
      metadataFilename: "./meta3.xml",
      files: ["./primary3.pdf"],
    },
  ];

  for (const document of documents) {
    const documentDir = path.join(tempDir, document.basePath);
    await mkdir(documentDir, { recursive: true });

    await writeFile(
      path.join(documentDir, document.metadataFilename),
      metadataContent,
      "utf-8",
    );

    for (const filename of document.files) {
      await writeFile(path.join(documentDir, filename), sampleFileContent);
    }
  }

  return tempDir;
}

describe("LocalPackageReaderAdapter integration tests", () => {
  let dipPackagePath: string;
  let adapter: PackageReaderService;

  beforeAll(async () => {
    dipPackagePath = await createSampleDipPackageFromResources();
    container.registerInstance("DIP_PATH_TOKEN", dipPackagePath);
    adapter = new PackageReaderService(
      new XmlDipParser(),
      new FileSystemPort(),
      new DataMapper(),
    );
    await adapter.setDipPath(dipPackagePath);
  });

  afterAll(async () => {
    if (dipPackagePath) {
      await rm(dipPackagePath, { recursive: true, force: true });
    }
  });

  // identifier: TU-F-Indexing-01
  // method_name: readDip()
  // description: should read and parse a DiP package correctly
  // expected_value: dip with Uuid "test-dip-uuid-1234" and UNKNOWN integrity status is returned when reading the package
  it("TU-F-Indexing-01: readDip() should read and parse a DiP package correctly", async () => {
    const dip = await adapter.readDip();

    expect(dip).toBeDefined();
    expect(dip.getId()).toBeNull();
    expect(dip.getUuid()).toBe("test-dip-uuid-1234");
    expect(dip.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
  });

  // identifier: TU-F-Indexing-02
  // method_name: readDocumentClasses()
  // description: should read and parse document classes from a DiP package
  // expected_value: DocumentClass with Id: null, DipId: null, DipUuid: "test-dip-uuid-1234", Uuid: "class-1", Name: "Class1", Timestamp: undefined and UNKNOWN integrity status is returned when reading the package
  it("TU-F-Indexing-02: readDocumentClasses() should read and parse document classes from a DiP package", async () => {
    const documentClasses = [];
    for await (const dc of adapter.readDocumentClasses()) {
      documentClasses.push(dc);
    }

    expect(documentClasses).toHaveLength(2);

    expect(documentClasses[0].getId()).toBeNull();
    expect(documentClasses[0].getDipId()).toBeNull();
    expect(documentClasses[0].getDipUuid()).toBe("test-dip-uuid-1234");
    expect(documentClasses[0].getUuid()).toBe("class-1");
    expect(documentClasses[0].getName()).toBe("Class1");
    expect(documentClasses[0].getTimestamp()).toBeUndefined();
    expect(documentClasses[0].getIntegrityStatus()).toBe(
      IntegrityStatusEnum.UNKNOWN,
    );

    expect(documentClasses[1].getId()).toBeNull();
    expect(documentClasses[1].getDipId()).toBeNull();
    expect(documentClasses[1].getDipUuid()).toBe("test-dip-uuid-1234");
    expect(documentClasses[1].getUuid()).toBe("class-2");
    expect(documentClasses[1].getName()).toBe("Class2");
    expect(documentClasses[1].getTimestamp()).toBeUndefined();
    expect(documentClasses[1].getIntegrityStatus()).toBe(
      IntegrityStatusEnum.UNKNOWN,
    );
  });

  // identifier: TU-F-Indexing-03
  // method_name: readProcesses()
  // description: should read and parse processes from a DiP package
  // expected_value: 3 Process entities with Id: null, DocumentClassId: null, DocumentClassUuid: "class-1" or "class-2", Uuid: "aip-1", "aip-2" or "aip-3", empty Metadata array and UNKNOWN integrity status are returned when reading the package
  it("TU-F-Indexing-03: readProcesses() should read and parse processes from a DiP package", async () => {
    const processes = [];
    for await (const process of adapter.readProcesses()) {
      processes.push(process);
    }

    expect(processes).toHaveLength(3);

    expect(processes[0].getId()).toBeNull();
    expect(processes[0].getDocumentClassId()).toBeNull();
    expect(processes[0].getDocumentClassUuid()).toBe("class-1");
    expect(processes[0].getUuid()).toBe("aip-1");
    expect(processes[0].getMetadata()).toEqual(
      new Metadata("Unknown", [], MetadataType.COMPOSITE),
    );
    expect(processes[0].getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);

    expect(processes[1].getUuid()).toBe("aip-2");
    expect(processes[2].getUuid()).toBe("aip-3");
  });

  // identifier: TU-F-Indexing-04
  // method_name: readDocuments()
  // description: should read and parse documents from a DiP package
  // expected_value: Document entities with Id: null, Uuid: "doc-1", "doc-2" or "doc-3", ProcessId: null, ProcessUuid: "aip-1", "aip-2" or "aip-3", empty Metadata array and UNKNOWN integrity status are returned when reading the package
  it("TU-F-Indexing-04: readDocuments() should read and parse documents from a DiP package", async () => {
    const documents = [];
    for await (const document of adapter.readDocuments()) {
      documents.push(document);
    }

    expect(documents).toHaveLength(3);

    expect(documents[0].getId()).toBeNull();
    expect(documents[0].getUuid()).toBe("doc-1");
    expect(documents[0].getProcessId()).toBeNull();
    expect(documents[0].getProcessUuid()).toBe("aip-1");
    expect(documents[0].getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);

    const metadata = documents[0].getMetadata().getChildren();
    expect(metadata).toHaveLength(5);

    expect(metadata[0].getName()).toBe("IdDoc");
    expect(metadata[0].getType()).toBe(MetadataType.COMPOSITE);

    expect(metadata[1].getName()).toBe("Riservato");
    expect(metadata[1].getStringValue()).toBe("true");
    expect(metadata[1].getType()).toBe(MetadataType.BOOLEAN);

    expect(metadata[2].getName()).toBe("TempoDiConservazione");
    expect(metadata[2].getStringValue()).toBe("10");
    expect(metadata[2].getType()).toBe(MetadataType.NUMBER);

    expect(metadata[3].getName()).toBe("Soggetti");
    expect(metadata[3].getChildren()).toHaveLength(2);
    expect(metadata[3].getType()).toBe(MetadataType.COMPOSITE);

    expect(metadata[4].getName()).toBe("Titolo");
    expect(metadata[4].getStringValue()).toBe("Documento di test");
    expect(metadata[4].getType()).toBe(MetadataType.STRING);

    expect(documents[1].getUuid()).toBe("doc-2");
    expect(documents[2].getUuid()).toBe("doc-3");
  });

  // identifier: TU-F-Indexing-05
  // method_name: readFiles()
  // description: should read and parse files from a DiP package
  // expected_value: File entities with Id: null, Filename: as in the package, Path: as in the package, Hash: empty string, IsMain: true for primary files and false for attachments, DocumentId: null, DocumentUuid: as in the package, and UNKNOWN integrity status are returned when reading the package
  it("TU-F-Indexing-05: readFiles() should read and parse files from a DiP package", async () => {
    const files = [];
    for await (const file of adapter.readFiles()) {
      files.push(file);
    }

    expect(files).toHaveLength(5);

    const primary1 = files.find((f) => f.getFilename() === "./primary.pdf");
    expect(primary1).toBeDefined();
    expect(primary1?.getId()).toBeNull();
    expect(primary1?.getPath()).toBe(
      path.join(dipPackagePath, "./class-1/aip-1/documents/doc-1/primary.pdf"),
    );
    expect(primary1?.getHash()).toBe("");
    expect(primary1?.getIsMain()).toBe(true);
    expect(primary1?.getDocumentId()).toBeNull();
    expect(primary1?.getDocumentUuid()).toBe("doc-1");
    expect(primary1?.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);

    const primary2 = files.find((f) => f.getFilename() === "./primary2.pdf");
    expect(primary2).toBeDefined();
    expect(primary2?.getPath()).toBe(
      path.join(dipPackagePath, "./class-2/aip-2/documents/doc-2/primary2.pdf"),
    );
    expect(primary2?.getHash()).toBe("");
    expect(primary2?.getId()).toBeNull();
    expect(primary2?.getDocumentId()).toBeNull();
    expect(primary2?.getUuid()).toBe("prim-2");
    expect(primary2?.getDocumentUuid()).toBe("doc-2");
    expect(primary2?.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
    expect(primary2?.getIsMain()).toBe(true);

    const att1 = files.find((f) => f.getFilename() === "./att1.pdf");
    expect(att1).toBeDefined();
    expect(att1?.getPath()).toBe(
      path.join(dipPackagePath, "./class-2/aip-2/documents/doc-2/att1.pdf"),
    );
    expect(att1?.getHash()).toBe("");
    expect(att1?.getId()).toBeNull();
    expect(att1?.getDocumentId()).toBeNull();
    expect(att1?.getUuid()).toBe("att-1");
    expect(att1?.getDocumentUuid()).toBe("doc-2");
    expect(att1?.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
    expect(att1?.getIsMain()).toBe(false);

    const att2 = files.find((f) => f.getFilename() === "./att2.pdf");
    expect(att2).toBeDefined();
    expect(att2?.getPath()).toBe(
      path.join(dipPackagePath, "./class-2/aip-2/documents/doc-2/att2.pdf"),
    );
    expect(att2?.getHash()).toBe("");
    expect(att2?.getId()).toBeNull();
    expect(att2?.getDocumentId()).toBeNull();
    expect(att2?.getUuid()).toBe("att-2");
    expect(att2?.getDocumentUuid()).toBe("doc-2");
    expect(att2?.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
    expect(att2?.getIsMain()).toBe(false);

    const primary3 = files.find((f) => f.getFilename() === "./primary3.pdf");
    expect(primary3).toBeDefined();
    expect(primary3?.getPath()).toBe(
      path.join(dipPackagePath, "./class-2/aip-3/documents/doc-3/primary3.pdf"),
    );
    expect(primary3?.getHash()).toBe("");
    expect(primary3?.getId()).toBeNull();
    expect(primary3?.getDocumentId()).toBeNull();
    expect(primary3?.getUuid()).toBe("prim-3");
    expect(primary3?.getDocumentUuid()).toBe("doc-3");
    expect(primary3?.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
    expect(primary3?.getIsMain()).toBe(true);
  });

  // identifier: TU-F-Indexing-06
  // method_name: readFileBytes()
  // description: should read file bytes from the package
  // expected_value: matches asserted behavior: read files with "Sample text content" content from the package
  it("TU-F-Indexing-06: readFileBytes() should read file bytes from the package", async () => {
    const filePath = path.join(
      dipPackagePath,
      "./class-1/aip-1/documents/doc-1/primary.pdf",
    );

    const fileSystemPort = new FileSystemPort();
    const stream = await fileSystemPort.openReadStream(filePath);

    let data = "";
    for await (const chunk of stream) {
      data += chunk;
    }

    expect(data).toBe("Sample text content");
  });
});
