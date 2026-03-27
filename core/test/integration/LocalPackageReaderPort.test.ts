import { DataMapper } from "../../src/repo/impl/utils/DataMapper";
import * as os from "node:os";
import * as path from "node:path";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { LocalPackageReaderAdapter } from "../../src/repo/impl/LocalPackageReaderAdapter";
import { XmlDipParser } from "../../src/repo/impl/utils/XmlDipParser";
import { FileSystemProvider } from "../../src/repo/impl/utils/FileSystemProvider";
import { IntegrityStatusEnum } from "../../src/value-objects/IntegrityStatusEnum";
import { MetadataType } from "../../src/value-objects/Metadata";

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
      basePath: "./class-1/aip-1/doc-1",
      metadataFilename: "./meta.xml",
      files: ["./primary.pdf"],
    },
    {
      basePath: "./class-2/aip-2/doc-2",
      metadataFilename: "./meta2.xml",
      files: ["./primary2.pdf", "./att1.pdf", "./att2.pdf"],
    },
    {
      basePath: "./class-2/aip-3/doc-3",
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
  let adapter: LocalPackageReaderAdapter;

  beforeAll(async () => {
    dipPackagePath = await createSampleDipPackageFromResources();
    adapter = new LocalPackageReaderAdapter(
      new XmlDipParser(),
      new FileSystemProvider(),
      new DataMapper(),
    );
  });

  afterAll(async () => {
    if (dipPackagePath) {
      await rm(dipPackagePath, { recursive: true, force: true });
    }
  });

  // identifier: TU-F-I-41
  // method_name: should()
  // description: should read and parse a DiP package correctly
  // expected_value: matches asserted behavior: read and parse a DiP package correctly
  it("should read and parse a DiP package correctly", async () => {
    const dip = await adapter.readDip(dipPackagePath);

    expect(dip).toBeDefined();
    expect(dip.getId()).toBeNull();
    expect(dip.getUuid()).toBe("test-dip-uuid-1234");
    expect(dip.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
  });

  // identifier: TU-F-I-42
  // method_name: should()
  // description: should read and parse document classes from a DiP package
  // expected_value: matches asserted behavior: read and parse document classes from a DiP package
  it("should read and parse document classes from a DiP package", async () => {
    const documentClasses = [];
    for await (const dc of adapter.readDocumentClasses(dipPackagePath)) {
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

  // identifier: TU-F-I-43
  // method_name: should()
  // description: should read and parse processes from a DiP package
  // expected_value: matches asserted behavior: read and parse processes from a DiP package
  it("should read and parse processes from a DiP package", async () => {
    const processes = [];
    for await (const process of adapter.readProcesses(dipPackagePath)) {
      processes.push(process);
    }

    expect(processes).toHaveLength(3);

    expect(processes[0].getId()).toBeNull();
    expect(processes[0].getDocumentClassId()).toBeNull();
    expect(processes[0].getDocumentClassUuid()).toBe("class-1");
    expect(processes[0].getUuid()).toBe("aip-1");
    expect(processes[0].getMetadata()).toEqual([]);
    expect(processes[0].getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);

    expect(processes[1].getUuid()).toBe("aip-2");
    expect(processes[2].getUuid()).toBe("aip-3");
  });

  // identifier: TU-F-I-44
  // method_name: should()
  // description: should read and parse documents from a DiP package
  // expected_value: matches asserted behavior: read and parse documents from a DiP package
  it("should read and parse documents from a DiP package", async () => {
    const documents = [];
    for await (const document of adapter.readDocuments(dipPackagePath)) {
      documents.push(document);
    }

    expect(documents).toHaveLength(3);

    expect(documents[0].getId()).toBeNull();
    expect(documents[0].getUuid()).toBe("doc-1");
    expect(documents[0].getProcessId()).toBeNull();
    expect(documents[0].getProcessUuid()).toBe("aip-1");
    expect(documents[0].getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);

    const metadata = documents[0].getMetadata();
    expect(metadata).toHaveLength(5);

    expect(metadata[0].name).toBe("IdDoc");
    expect(Array.isArray(metadata[0].value)).toBe(true);
    expect(metadata[0].type).toBe(MetadataType.COMPOSITE);

    expect(metadata[1].name).toBe("Riservato");
    expect(metadata[1].value).toBe("true");
    expect(metadata[1].type).toBe(MetadataType.BOOLEAN);

    expect(metadata[2].name).toBe("TempoDiConservazione");
    expect(metadata[2].value).toBe("10");
    expect(metadata[2].type).toBe(MetadataType.NUMBER);

    expect(metadata[3].name).toBe("Soggetti");
    expect(Array.isArray(metadata[3].value)).toBe(true);
    expect(metadata[3].type).toBe(MetadataType.COMPOSITE);

    expect(metadata[4].name).toBe("Titolo");
    expect(metadata[4].value).toBe("Documento di test");
    expect(metadata[4].type).toBe(MetadataType.STRING);

    expect(documents[1].getUuid()).toBe("doc-2");
    expect(documents[2].getUuid()).toBe("doc-3");
  });

  // identifier: TU-F-I-45
  // method_name: should()
  // description: should read and parse files from a DiP package
  // expected_value: matches asserted behavior: read and parse files from a DiP package
  it("should read and parse files from a DiP package", async () => {
    const files = [];
    for await (const file of adapter.readFiles(dipPackagePath)) {
      files.push(file);
    }

    expect(files).toHaveLength(5);

    expect(files[0].getId()).toBeNull();
    expect(files[0].getFilename()).toBe("./primary.pdf");
    expect(files[0].getPath()).toBe("./class-1/aip-1/doc-1/./primary.pdf");
    expect(files[0].getHash()).toBe("");
    expect(files[0].getIsMain()).toBe(true);
    expect(files[0].getDocumentId()).toBeNull();
    expect(files[0].getDocumentUuid()).toBe("doc-1");
    expect(files[0].getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);

    expect(files[1].getFilename()).toBe("./primary2.pdf");
    expect(files[1].getIsMain()).toBe(true);

    expect(files[2].getFilename()).toBe("./att1.pdf");
    expect(files[2].getIsMain()).toBe(false);

    expect(files[3].getFilename()).toBe("./att2.pdf");
    expect(files[3].getIsMain()).toBe(false);

    expect(files[4].getFilename()).toBe("./primary3.pdf");
    expect(files[4].getIsMain()).toBe(true);
  });

  // identifier: TU-F-I-46
  // method_name: should()
  // description: should read file bytes from the package
  // expected_value: matches asserted behavior: read file bytes from the package
  it("should read file bytes from the package", async () => {
    const filePath = path.join(
      dipPackagePath,
      "./class-1/aip-1/doc-1/./primary.pdf",
    );

    const stream = await adapter.readFileBytes(filePath);

    let data = "";
    for await (const chunk of stream) {
      data += chunk;
    }

    expect(data).toBe("Sample text content");
  });
});
