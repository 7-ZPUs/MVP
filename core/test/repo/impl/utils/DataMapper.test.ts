import { describe, it, expect } from "vitest";
import { DataMapper } from "../../../../src/repo/impl/utils/DataMapper";
import { Metadata, MetadataType } from "../../../../src/value-objects/Metadata";

// Global variable: JS structure of example dipindex_test.xml as returned by xml2js
const exampleDipIndex = {
  DiPIndex: {
    PackageInfo: {
      ProcessUUID: "test-dip-uuid-1234",
    },
    PackageContent: {
      DiPDocuments: {
        DocumentClass: [
          {
            $: { name: "Class1", uuid: "class-1" },
            AiP: [
              {
                $: { uuid: "aip-1" },
                AiPRoot: "./class-1/aip-1",
                Document: {
                  $: { uuid: "doc-1" },
                  DocumentPath: "./documents/doc-1",
                  Files: {
                    $: { FilesCount: "2" },
                    Metadata: { $: { uuid: "meta-1" }, _: "./meta.xml" },
                    Primary: { $: { uuid: "prim-1" }, _: "./primary.pdf" },
                  },
                },
              },
            ],
          },
          {
            $: { name: "Class2", uuid: "class-2" },
            AiP: [
              {
                $: { uuid: "aip-2" },
                AiPRoot: "./class-2/aip-2",
                Document: {
                  $: { uuid: "doc-2" },
                  DocumentPath: "./documents/doc-2",
                  Files: {
                    $: { FilesCount: "4" },
                    Metadata: { $: { uuid: "meta-2" }, _: "./meta2.xml" },
                    Primary: { $: { uuid: "prim-2" }, _: "./primary2.pdf" },
                    Attachments: [
                      { $: { uuid: "att-1" }, _: "./att1.pdf" },
                      { $: { uuid: "att-2" }, _: "./att2.pdf" },
                    ],
                  },
                },
              },
              {
                $: { uuid: "aip-3" },
                AiPRoot: "./class-2/aip-3",
                Document: {
                  $: { uuid: "doc-3" },
                  DocumentPath: "./documents/doc-3",
                  Files: {
                    $: { FilesCount: "2" },
                    Metadata: { $: { uuid: "meta-3" }, _: "./meta3.xml" },
                    Primary: { $: { uuid: "prim-3" }, _: "./primary3.pdf" },
                  },
                },
              },
            ],
          },
        ],
      },
    },
  },
};

// Global variable: JS structure of aipinfo_test.xml as returned by xml2js
const exampleAipInfo = {
  AiPInfo: {
    Process: {
      $: { uuid: "dummy-process-uuid" },
      Start: {
        Date: "2025-01-01T00:00:00Z",
        UserUUID: "dummy-user-uuid",
        Source: "DummySource",
      },
      End: {
        Date: "2025-01-01T01:00:00Z",
        UserUUID: "dummy-user-uuid",
        Source: "DummySource",
        Status: "Completed",
      },
      DocumentClass: {
        $: { uuid: "dummy-class-uuid" },
        Name: "DummyClass",
        Version: "1",
        ArchiveUUID: "dummy-archive-uuid",
        AcceptedMIMEType: {
          MIMEType: {
            $: { uuid: "dummy-mime-uuid", extension: ".pdf" },
            _: "application/pdf",
          },
        },
        PrecompiledValues: "",
      },
      Customization: {
        Properties: {
          $: { name: "useDefaultMetadata" },
          _: "true",
        },
      },
      SubmissionSession: {
        $: { uuid: "dummy-session-uuid" },
        Start: {
          Date: "2025-01-01T00:00:00Z",
          UserUUID: "dummy-user-uuid",
          Source: "DummySource",
        },
        End: {
          Date: "2025-01-01T00:30:00Z",
          UserUUID: "dummy-user-uuid",
          Source: "DummySource",
          Status: "Completed",
        },
      },
      PreservationSession: {
        $: { uuid: "dummy-preservation-uuid" },
        Start: {
          Date: "2025-01-01T00:45:00Z",
          UserUUID: "dummy-user-uuid",
          Source: "DummySource",
        },
        HashEncoding: "Base64",
        AdvancedElectronicSignaturesFormat: "XAdES",
        DocumentsStats: {
          SipCount: "1",
          DocumentsCount: "1",
          DocumentsFilesCount: "1",
          DocumentsOverallSize: { $: { unit: "bytes" }, _: "12345" },
          MimeTypeStats: { $: { extension: "application/pdf" }, _: "1" },
        },
      },
    },
  },
};

const exampleMetadata = {
  Document: {
    DocumentoInformatico: {
      IdDoc: {
        ImprontaCrittograficaDelDocumento: {
          Impronta: "hash-main-prim-1",
          Algoritmo: "SHA-256",
        },
        Identificativo: "prim-1",
      },
      Riservato: "true",
      TempoDiConservazione: "10",
      Soggetti: {
        Ruolo: [{ Tipo: "Autore" }, { Tipo: "Destinatario" }],
      },
      Titolo: "Documento di test",
      Allegati: {
        NumeroAllegati: "2",
        IndiceAllegati: [
          {
            IdDoc: {
              ImprontaCrittograficaDelDocumento: {
                Impronta: "hash-att-1",
                Algoritmo: "SHA-256",
              },
              Identificativo: "att-1",
            },
            Descrizione: "Attachment 1",
          },
          {
            IdDoc: {
              ImprontaCrittograficaDelDocumento: {
                Impronta: "hash-att-2",
                Algoritmo: "SHA-256",
              },
              Identificativo: "att-2",
            },
            Descrizione: "Attachment 2",
          },
        ],
      },
    },
  },
};

describe("DataMapper", () => {
  it("TU-F-Indexing-136: mapDip() returns correctly mapped Dip entity from dipindex_test.xml structure", () => {
    const mapper = new DataMapper();
    const result = mapper.mapDip(exampleDipIndex);
    expect(result.getUuid()).toBe("test-dip-uuid-1234");
  });

  it("TU-F-Indexing-137: mapDocumentClass() returns correctly mapped DocumentClass entity from dipindex_test.xml structure", () => {
    const mapper = new DataMapper();
    const result = mapper.mapDocumentClasses(exampleDipIndex);
    expect(result[0].getUuid()).toBe("class-1");
    expect(result[0].getName()).toBe("Class1");
  });

  it("TU-F-Indexing-138: getProcessMappers() should return correctly mapped paths for processes in the dipindex_test.xml structure", () => {
    const mapper = new DataMapper();
    const result = mapper.getProcessMappers(exampleDipIndex);

    expect(result[0].metadataRelativePath).toBe(
      "./class-1/aip-1/AiPInfo.aip-1.xml",
    );
    expect(result[1].metadataRelativePath).toBe(
      "./class-2/aip-2/AiPInfo.aip-2.xml",
    );
  });

  it("TU-F-Indexing-138: getProcessMappers() should map processes from dipindex_test.xml structure correctly", () => {
    const mapper = new DataMapper();
    const result = mapper.getProcessMappers(exampleDipIndex);
    const mappedProcesses = result.map((r) => r.map(exampleAipInfo));
    const proc = mappedProcesses[0];
    expect(proc.getUuid()).toBe("aip-1");
    expect(proc.getDocumentClassUuid()).toBe("class-1");

    // Check process metadata
    const metadata = proc.getMetadata();

    // Helper to find a metadata entry by name
    const findMeta = (arr: any[], name: string) =>
      arr.find((m) => m.name === name);

    // All actual metadata is under the 'Process' key
    const processMeta = findMeta(metadata, "Process");
    expect(processMeta).toBeDefined();
    if (!processMeta || !Array.isArray(processMeta.value))
      throw new Error("Process metadata missing or malformed");
    const processValue = processMeta.value;

    // Start
    const startMeta = findMeta(processValue, "Start");
    expect(startMeta).toBeDefined();
    if (startMeta) {
      expect(startMeta.value).toEqual([
        expect.objectContaining({
          name: "Date",
          value: "2025-01-01T00:00:00Z",
        }),
        expect.objectContaining({ name: "UserUUID", value: "dummy-user-uuid" }),
        expect.objectContaining({ name: "Source", value: "DummySource" }),
      ]);
    }

    // End
    const endMeta = findMeta(processValue, "End");
    expect(endMeta).toBeDefined();
    if (endMeta) {
      expect(endMeta.value).toEqual([
        expect.objectContaining({
          name: "Date",
          value: "2025-01-01T01:00:00Z",
        }),
        expect.objectContaining({ name: "UserUUID", value: "dummy-user-uuid" }),
        expect.objectContaining({ name: "Source", value: "DummySource" }),
        expect.objectContaining({ name: "Status", value: "Completed" }),
      ]);
    }

    // SubmissionSession
    const submissionMeta = findMeta(processValue, "SubmissionSession");
    expect(submissionMeta).toBeDefined();
    if (submissionMeta && Array.isArray(submissionMeta.value)) {
      const submissionStart = findMeta(submissionMeta.value, "Start");
      expect(submissionStart?.value).toEqual([
        expect.objectContaining({
          name: "Date",
          value: "2025-01-01T00:00:00Z",
        }),
        expect.objectContaining({ name: "UserUUID", value: "dummy-user-uuid" }),
        expect.objectContaining({ name: "Source", value: "DummySource" }),
      ]);
      const submissionEnd = findMeta(submissionMeta.value, "End");
      expect(submissionEnd?.value).toEqual([
        expect.objectContaining({
          name: "Date",
          value: "2025-01-01T00:30:00Z",
        }),
        expect.objectContaining({ name: "UserUUID", value: "dummy-user-uuid" }),
        expect.objectContaining({ name: "Source", value: "DummySource" }),
        expect.objectContaining({ name: "Status", value: "Completed" }),
      ]);
    } else if (submissionMeta) {
      throw new Error("submissionMeta.value is not an array as expected");
    }

    // PreservationSession
    const preservationMeta = findMeta(processValue, "PreservationSession");
    expect(preservationMeta).toBeDefined();
    if (preservationMeta && Array.isArray(preservationMeta.value)) {
      const preservationStart = findMeta(preservationMeta.value, "Start");
      expect(preservationStart?.value).toEqual([
        expect.objectContaining({
          name: "Date",
          value: "2025-01-01T00:45:00Z",
        }),
        expect.objectContaining({ name: "UserUUID", value: "dummy-user-uuid" }),
        expect.objectContaining({ name: "Source", value: "DummySource" }),
      ]);
      // End is not present in exampleAipInfo, so only check if present
      const preservationEnd = findMeta(preservationMeta.value, "End");
      if (preservationEnd) {
        expect(preservationEnd.value).toBeDefined();
      }
    } else if (preservationMeta) {
      throw new Error("preservationMeta.value is not an array as expected");
    }
  });

  it("TU-F-Indexing-139: getProcessMappers() should handle missing optional metadata gracefully", () => {
    const mapper = new DataMapper();
    const result = mapper.getProcessMappers(exampleDipIndex);
    const mappedProcesses = result.map((r) =>
      r.map({ AiPInfo: { Process: {} } }),
    );
    const proc = mappedProcesses[0];
    expect(proc.getUuid()).toBe("aip-1");
    expect(proc.getDocumentClassUuid()).toBe("class-1");
    expect(proc.getMetadata()).toEqual([]);
  });

  it("TU-F-Indexing-140: getProcessMappers() should handle unexpected metadata structures gracefully", () => {
    const mapper = new DataMapper();
    const result = mapper.getProcessMappers(exampleDipIndex);
    const malformedAipInfo = { AiPInfo: { Process: { $: {} } } };
    const mappedProcesses = result.map((r) => r.map(malformedAipInfo));
    const proc = mappedProcesses[0];
    expect(proc.getUuid()).toBe("aip-1");
    expect(proc.getDocumentClassUuid()).toBe("class-1");
    expect(proc.getMetadata()).toEqual([]);
  });

  it("TU-F-Indexing-141: getDocumentMappers() should map documents correctly", () => {
    const mapper = new DataMapper();
    const result = mapper.getDocumentMappers(exampleDipIndex);

    // xml2js-like shape expected by DataMapper.extractDocumentMetadata
    const metadataJsMock = {
      Document: [exampleMetadata.Document],
    };

    const mappedDocs = result.map((r) => r.map(metadataJsMock));
    const doc = mappedDocs[0];
    // Test all Document properties
    expect(doc.getUuid()).toBe("doc-1");
    expect(doc.getProcessUuid()).toBe("aip-1");
    expect(doc.getIntegrityStatus()).toBe("UNKNOWN"); // Default when not specified
    const metadata = doc.getMetadata()[0];
    expect(metadata.getName()).toBe("DocumentoInformatico");
    expect(metadata.getChildren()).toHaveLength(6);
    expect(metadata.getChildren()[0].getName()).toBe("IdDoc");
    expect(metadata.getChildren()[0].getChildren()).toHaveLength(2);
    expect(metadata.getChildren()[0].getChildren()[0].getName()).toBe(
      "ImprontaCrittograficaDelDocumento",
    );
    expect(
      metadata.getChildren()[0].getChildren()[0].getChildren(),
    ).toHaveLength(2);
    expect(
      metadata
        .getChildren()[0]
        .getChildren()[0]
        .getChildren()[0]
        .getName(),
    ).toBe("Impronta");
    expect(
      metadata
        .getChildren()[0]
        .getChildren()[0]
        .getChildren()[1]
        .getName(),
    ).toBe("Algoritmo");
    expect(
      metadata.getChildren()[0].getChildren()[1].getName(),
    ).toBe("Identificativo");
    expect(metadata.getChildren()[1].getName()).toBe(
      "Riservato",
    );
    expect(metadata.getChildren()[2].getName()).toBe(
      "TempoDiConservazione",
    );
    expect(metadata.getChildren()[3].getName()).toBe(
      "Soggetti",
    );
    expect(
      metadata.getChildren()[3].getChildren(),
    ).toHaveLength(2);
    expect(
      metadata.getChildren()[3].getChildren()[0].getName(),
    ).toBe("Ruolo");
    expect(
      metadata
        .getChildren()[3]
        .getChildren()[0]
        .getChildren()[0],
    ).toEqual(new Metadata("Tipo", "Autore", MetadataType.STRING));
    expect(metadata.getChildren()[4].getName()).toBe("Titolo");
    expect(metadata.getChildren()[4]).toEqual(
      new Metadata("Titolo", "Documento di test", MetadataType.STRING),
    );
  });

  it("TU-F-Indexing-142: getDocumentMappers() should return correctly mapped paths for documents in the dipindex_test.xml structure", () => {
    const mapper = new DataMapper();
    const result = mapper.getDocumentMappers(exampleDipIndex);

    expect(result[0].metadataRelativePath).toBe(
      "./class-1/aip-1/documents/doc-1/meta.xml",
    );
    expect(result[1].metadataRelativePath).toBe(
      "./class-2/aip-2/documents/doc-2/meta2.xml",
    );
  });

  it("TU-F-Indexing-143: getDocumentMappers() should handle missing optional metadata gracefully", () => {
    const mapper = new DataMapper();
    const result = mapper.getDocumentMappers(exampleDipIndex);
    const mappedDocs = result.map((r) => r.map({ Document: [{}] }));
    const doc = mappedDocs[0];
    expect(doc.getUuid()).toBe("doc-1");
    expect(doc.getProcessUuid()).toBe("aip-1");
    expect(doc.getIntegrityStatus()).toBe("UNKNOWN");
    expect(doc.getMetadata()).toEqual([]);
  });

  it("TU-F-Indexing-144: getFileMappers() should return correctly mapped paths for files in the dipindex_test.xml structure", () => {
    const mapper = new DataMapper();
    const result = mapper.getFileMappers(exampleDipIndex);
    expect(result).toHaveLength(5);

    const metadataPaths = result.map((r) => r.metadataRelativePath);

    expect(
      metadataPaths.filter(
        (p) => p === "./class-1/aip-1/documents/doc-1/meta.xml",
      ),
    ).toHaveLength(1);
    expect(
      metadataPaths.filter(
        (p) => p === "./class-2/aip-2/documents/doc-2/meta2.xml",
      ),
    ).toHaveLength(3);
    expect(
      metadataPaths.filter(
        (p) => p === "./class-2/aip-3/documents/doc-3/meta3.xml",
      ),
    ).toHaveLength(1);
  });

  it("TU-F-Indexing-145: getFileMappers() should map all files correctly", () => {
    const mapper = new DataMapper();
    const result = mapper.getFileMappers(exampleDipIndex);
    const metadataJsMock = { Document: [exampleMetadata.Document] };
    const mappedFiles = result.map((r) => r.map(metadataJsMock));
    expect(mappedFiles).toHaveLength(5);

    expect(mappedFiles[0].getUuid()).toBe("prim-1");
    expect(mappedFiles[0].getFilename()).toBe("./primary.pdf");
    expect(mappedFiles[0].getPath()).toBe(
      "./class-1/aip-1/documents/doc-1/primary.pdf",
    );
    expect(mappedFiles[0].getHash()).toBe("hash-main-prim-1");
    expect(mappedFiles[0].getIsMain()).toBe(true);
    expect(mappedFiles[0].getDocumentId()).toBeNull();

    expect(mappedFiles[1].getUuid()).toBe("prim-2");
    expect(mappedFiles[1].getHash()).toBe("");
    expect(mappedFiles[1].getIsMain()).toBe(true);

    expect(mappedFiles[2].getUuid()).toBe("prim-3");
    expect(mappedFiles[2].getHash()).toBe("");
    expect(mappedFiles[2].getIsMain()).toBe(true);

    expect(mappedFiles[3].getUuid()).toBe("att-1");
    expect(mappedFiles[3].getFilename()).toBe("./att1.pdf");
    expect(mappedFiles[3].getPath()).toBe(
      "./class-2/aip-2/documents/doc-2/att1.pdf",
    );
    expect(mappedFiles[3].getHash()).toBe("hash-att-1");
    expect(mappedFiles[3].getIsMain()).toBe(false);

    expect(mappedFiles[4].getUuid()).toBe("att-2");
    expect(mappedFiles[4].getFilename()).toBe("./att2.pdf");
    expect(mappedFiles[4].getPath()).toBe(
      "./class-2/aip-2/documents/doc-2/att2.pdf",
    );
    expect(mappedFiles[4].getHash()).toBe("hash-att-2");
    expect(mappedFiles[4].getIsMain()).toBe(false);
  });
});
