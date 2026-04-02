const fs = require('fs');
const content = fs.readFileSync('/workspaces/MVP/core/test/unit/indexing/LocalPackageReaderAdapter.test.ts', 'utf8');

const regex = /describe\("LocalPackageReaderAdapter",.*?\n\}\);\n/s;
const newDescribe = `describe("LocalPackageReaderAdapter", () => {
  const PREDEFINED_DIP_INDEX_XML = \`<?xml version="1.0" encoding="UTF-8"?>
<DiPIndex>
  <PackageInfo>
    <ProcessUUID>dip-1</ProcessUUID>
  </PackageInfo>
  <PackageContent>
    <DiPDocuments>
      <DocumentClass name="Class 1" uuid="dc-1" validFrom="2026-01-01T00:00:00Z">
        <AiP uuid="proc-1">
          <AiPRoot>./dc-1/proc-1</AiPRoot>
          <Document uuid="doc-1">
            <DocumentPath>docs/doc-1</DocumentPath>
            <Files>
              <Metadata uuid="meta-1">metadata.xml</Metadata>
              <Primary uuid="file-1">main.pdf</Primary>
            </Files>
          </Document>
        </AiP>
      </DocumentClass>
    </DiPDocuments>
  </PackageContent>
</DiPIndex>\`;

  const PREDEFINED_AIP_INFO_XML = \`<?xml version="1.0" encoding="UTF-8"?>
<AiPInfo>
  <Start>WebGui</Start>
  <End>Completata</End>
  <ProcessData>
    <SubmissionSession>Completed</SubmissionSession>
    <PreservationSession>Saved</PreservationSession>
  </ProcessData>
</AiPInfo>\`;

  const PREDEFINED_METADATA_XML = \`<?xml version="1.0" encoding="UTF-8"?>
<Document>
  <DocumentoInformatico>
    <TipologiaDocumentale>Note Spese</TipologiaDocumentale>
    <Riservato>false</Riservato>
    <DatiProtocollo>
      <Numero>2023-001</Numero>
    </DatiProtocollo>
  </DocumentoInformatico>
</Document>\`;

  const getMockDeps = () => {
    const parser = new XmlDipParser();
    const mockFileSystem: any = {
      readFile: vi.fn(),
      openReadStream: vi.fn(),
      readTextFile: vi.fn(),
      openReadTextStream: vi.fn(),
      fileExists: vi.fn(),
      listFiles: vi.fn(),
    };
    return { parser, mockFileSystem };
  };

  it("TU-F-I-01: readDip() should return the DiP core entity", async () => {
    const { parser, mockFileSystem } = getMockDeps();
    mockFileSystem.listFiles.mockResolvedValue(["DiPIndex.uuid.xml"]);
    mockFileSystem.readTextFile.mockResolvedValue(PREDEFINED_DIP_INDEX_XML);

    const adapter = new LocalPackageReaderAdapter(parser, mockFileSystem);
    const dip = await adapter.readDip("dummy/path");

    expect(dip).toBeInstanceOf(Dip);
    expect(dip.getUuid()).toBe("dip-1");
  });

  it("TU-F-I-02: readDocumentClasses() should iterate and return mapped document classes", async () => {
    const { parser, mockFileSystem } = getMockDeps();
    mockFileSystem.listFiles.mockResolvedValue(["DiPIndex.uuid.xml"]);
    mockFileSystem.readTextFile.mockResolvedValue(PREDEFINED_DIP_INDEX_XML);

    const adapter = new LocalPackageReaderAdapter(parser, mockFileSystem);
    const itr = await adapter.readDocumentClasses("dummy/path").next();

    expect(itr.value).toBeDefined();
    expect(itr.value?.getDipUuid()).toBe("dip-1");
    expect(itr.value?.getUuid()).toBe("dc-1");
    expect(itr.value?.getName()).toBe("Class 1");
  });

  it("TU-F-I-03: readProcesses() should iterate, read AiPInfo, parse process metadata and return mapped processes", async () => {
    const { parser, mockFileSystem } = getMockDeps();
    mockFileSystem.listFiles.mockResolvedValue(["DiPIndex.uuid.xml"]);
    mockFileSystem.readTextFile.mockImplementation(async (filePath) => {
      if (filePath.endsWith("AiPInfo.proc-1.xml")) return PREDEFINED_AIP_INFO_XML;
      return PREDEFINED_DIP_INDEX_XML;
    });

    const adapter = new LocalPackageReaderAdapter(parser, mockFileSystem);
    const itr = await adapter.readProcesses("dummy/path").next();

    expect(itr.value).toBeDefined();
    expect(itr.value?.getDocumentClassUuid()).toBe("dc-1");
    expect(itr.value?.getUuid()).toBe("proc-1");
    const metadata = itr.value?.getMetadata();
    expect(metadata).toBeDefined();
    expect(metadata?.find((m: any) => m.name === "Start")?.value).toBe("WebGui");

    expect(mockFileSystem.readTextFile).toHaveBeenCalledWith(
      expect.stringContaining("AiPInfo.proc-1.xml")
    );
  });

  it("TU-F-I-04: readDocuments() should iterate, read metadata.xml, parse doc metadata and return mapped documents", async () => {
    const { parser, mockFileSystem } = getMockDeps();
    mockFileSystem.listFiles.mockResolvedValue(["DiPIndex.uuid.xml"]);
    mockFileSystem.readTextFile.mockImplementation(async (filePath) => {
      if (filePath.endsWith("metadata.xml")) return PREDEFINED_METADATA_XML;
      return PREDEFINED_DIP_INDEX_XML;
    });

    const adapter = new LocalPackageReaderAdapter(parser, mockFileSystem);
    const itr = await adapter.readDocuments("dummy/path").next();

    expect(itr.value).toBeDefined();
    expect(itr.value?.getProcessUuid()).toBe("proc-1");
    expect(itr.value?.getUuid()).toBe("doc-1");
    const metadata = itr.value?.getMetadata();
    expect(metadata).toBeDefined();
    expect(metadata?.find((m: any) => m.name === "TipologiaDocumentale")?.value).toBe("Note Spese");

    expect(mockFileSystem.readTextFile).toHaveBeenCalledWith(
      expect.stringContaining("metadata.xml")
    );
  });

  it("TU-F-I-05: readFiles() should iterate and return mapped files", async () => {
    const { parser, mockFileSystem } = getMockDeps();
    mockFileSystem.listFiles.mockResolvedValue(["DiPIndex.uuid.xml"]);
    mockFileSystem.readTextFile.mockResolvedValue(PREDEFINED_DIP_INDEX_XML);

    const adapter = new LocalPackageReaderAdapter(parser, mockFileSystem);
    const itr = await adapter.readFiles("dummy/path").next();

    expect(itr.value).toBeDefined();
    expect(itr.value?.getDocumentUuid()).toBe("doc-1");
    expect(itr.value?.getFilename()).toBe("main.pdf");
    expect(itr.value?.getPath()).toBe("docs/doc-1/main.pdf");
    expect(itr.value?.getIsMain()).toBe(true);
  });

  it("TU-F-I-06: readFileBytes() should delegate stream opening to file system provider", async () => {
    const { parser, mockFileSystem } = getMockDeps();
    const adapter = new LocalPackageReaderAdapter(parser, mockFileSystem);

    mockFileSystem.openReadStream.mockReturnValue("mock-stream");
    const stream = await adapter.readFileBytes("dummy/path/file.pdf");

    expect(stream).toBe("mock-stream");
    expect(mockFileSystem.openReadStream).toHaveBeenCalledWith(
      "dummy/path/file.pdf",
    );
  });

  it("TU-F-I-07: should resolve DiP index file using regex format DiPIndex.<uuid>.xml", async () => {
    const { parser, mockFileSystem } = getMockDeps();
    mockFileSystem.listFiles.mockResolvedValue([
      "README.md",
      "DiPIndex.abc-123.xml",
      "other.xml",
    ]);
    mockFileSystem.readTextFile.mockResolvedValue(PREDEFINED_DIP_INDEX_XML);

    const adapter = new LocalPackageReaderAdapter(parser, mockFileSystem);
    const dip = await adapter.readDip("dummy/path");

    expect(dip).toBeInstanceOf(Dip);
    expect(mockFileSystem.listFiles).toHaveBeenCalledWith("dummy/path");
    expect(mockFileSystem.readTextFile).toHaveBeenCalledWith(
      expect.stringContaining("DiPIndex.abc-123.xml")
    );
  });

  it("TU-F-I-08: should reuse current parsed index for the same dipPath and reload for a different dipPath", async () => {
    const { parser, mockFileSystem } = getMockDeps();
    mockFileSystem.listFiles.mockResolvedValue(["DiPIndex.aaa.xml"]);
    mockFileSystem.readTextFile.mockResolvedValue(PREDEFINED_DIP_INDEX_XML);

    const adapter = new LocalPackageReaderAdapter(parser, mockFileSystem);

    await adapter.readDip("dip/path/a");
    await adapter.readDip("dip/path/a");
    await adapter.readDip("dip/path/b");

    expect(mockFileSystem.listFiles).toHaveBeenCalledTimes(2);
    expect(mockFileSystem.readTextFile).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("DiPIndex.aaa.xml")
    );
    expect(mockFileSystem.readTextFile).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("DiPIndex.aaa.xml")
    );
  });
});
`;

const updated = content.replace(regex, newDescribe);
fs.writeFileSync('/workspaces/MVP/core/test/unit/indexing/LocalPackageReaderAdapter.test.ts', updated);
