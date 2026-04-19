import { beforeEach, describe, expect, it, vi } from "vitest";

import { DocumentPersistenceAdapter } from "../../../src/repo/impl/DocumentPersistenceAdapter";
import { DocumentDAO } from "../../../src/dao/DocumentDAO";
import { Document } from "../../../src/entity/Document";
import { DocumentJsonPersistenceRow } from "../../../src/dao/mappers/DocumentMapper";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";
import { Metadata, MetadataType } from "../../../src/value-objects/Metadata";

describe("DocumentPersistenceAdapter", () => {
  let dao: {
    getById: ReturnType<typeof vi.fn>;
    getByProcessId: ReturnType<typeof vi.fn>;
    getByStatus: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    updateIntegrityStatus: ReturnType<typeof vi.fn>;
    searchDocument: ReturnType<typeof vi.fn>;
    searchDocumentSemantic: ReturnType<typeof vi.fn>;
    getIndexedDocumentsCount: ReturnType<typeof vi.fn>;
  };
  let repo: DocumentPersistenceAdapter;

  beforeEach(() => {
    dao = {
      getById: vi.fn(),
      getByProcessId: vi.fn(),
      getByStatus: vi.fn(),
      save: vi.fn(),
      updateIntegrityStatus: vi.fn(),
      searchDocument: vi.fn(),
      searchDocumentSemantic: vi.fn(),
      getIndexedDocumentsCount: vi.fn(),
    };
    repo = new DocumentPersistenceAdapter(dao as unknown as DocumentDAO);
  });

  const metadata = new Metadata(
    "root",
    [new Metadata("titolo", "Documento A", MetadataType.STRING)],
    MetadataType.COMPOSITE,
  );

  const createRow = (
    id: number,
    uuid: string,
    metadataJson = '{"root":{"titolo":"Documento A"}}',
  ): DocumentJsonPersistenceRow => ({
    id,
    uuid,
    integrityStatus: IntegrityStatusEnum.UNKNOWN,
    processId: 10,
    processUuid: "process-uuid",
    metadataJson,
  });

  it("TU-F-browsing-55: save() should successfully persist a document with complex metadata", () => {
    const input = new Document("doc-1", metadata, "process-uuid");
    dao.save.mockReturnValue(createRow(1, "doc-1"));

    const result = repo.save(input);

    expect(dao.save).toHaveBeenCalledWith(input);
    expect(result.getId()).toBe(1);
    expect(result.getUuid()).toBe("doc-1");
  });

  it("TU-S-browsing-56: save() should handle updating an existing document", () => {
    dao.save.mockReturnValue(createRow(2, "doc-unique"));

    const result = repo.save(
      new Document("doc-unique", metadata, "process-uuid"),
    );

    expect(result.getUuid()).toBe("doc-unique");
    expect(dao.save).toHaveBeenCalledTimes(1);
  });

  it("TU-F-browsing-57: getByProcessId() should return a list of documents", () => {
    const rows = [createRow(11, "doc-p1")];
    dao.getByProcessId.mockReturnValue(rows);

    const results = repo.getByProcessId(1);

    expect(dao.getByProcessId).toHaveBeenCalledWith(1);
    expect(results).toHaveLength(1);
    expect(results[0].getUuid()).toBe("doc-p1");
  });

  it("TU-F-browsing-58: getByProcessId() should return an empty array", () => {
    dao.getByProcessId.mockReturnValue([]);

    const results = repo.getByProcessId(999);

    expect(results).toHaveLength(0);
  });

  it("TU-F-browsing-59: getByStatus() should return documents", () => {
    const rows = [createRow(12, "doc-s1")];
    dao.getByStatus.mockReturnValue(rows);

    const results = repo.getByStatus(IntegrityStatusEnum.VALID);

    expect(dao.getByStatus).toHaveBeenCalledWith(IntegrityStatusEnum.VALID);
    expect(results).toHaveLength(1);
  });

  it("TU-F-browsing-60: getByStatus() should return an empty array", () => {
    dao.getByStatus.mockReturnValue([]);

    expect(repo.getByStatus(IntegrityStatusEnum.VALID)).toHaveLength(0);
  });

  it("TU-S-browsing-61: updateIntegrityStatus() should successfully update the status", () => {
    repo.updateIntegrityStatus(7, IntegrityStatusEnum.VALID);

    expect(dao.updateIntegrityStatus).toHaveBeenCalledWith(
      7,
      IntegrityStatusEnum.VALID,
    );
  });

  it("TU-S-browsing-62: save() should fallback to select", () => {
    dao.save.mockReturnValue(createRow(33, "doc-fallback"));

    const result = repo.save(
      new Document("doc-fallback", metadata, "process-uuid"),
    );

    expect(result.getId()).toBe(33);
  });

  it("TU-F-browsing-63: getById() should return null quando il documento non esiste", () => {
    dao.getById.mockReturnValue(null);

    const result = repo.getById(999);

    expect(dao.getById).toHaveBeenCalledWith(999);
    expect(result).toBeNull();
  });

  it("searchDocument delega al DAO con i filtri", () => {
    dao.searchDocument.mockReturnValue([]);

    const emptyFilters = {
      common: {
        chiaveDescrittiva: {} as any,
        classificazione: {} as any,
        conservazione: {} as any,
        note: {} as any,
        tipoDocumento: {} as any,
      },
      diDai: {},
      aggregate: {},
      subject: {},
      custom: {},
    };
    const results = repo.searchDocument(emptyFilters as any);

    expect(dao.searchDocument).toHaveBeenCalledWith(emptyFilters);
    expect(results).toEqual([]);
  });

  it("searchDocumentSemantic delega al DAO", async () => {
    const semantic = [
      {
        row: createRow(
          99,
          "doc-uuid",
          '{"root":{"titolo":"Documento semantico"}}',
        ),
        score: 0.8,
      },
    ];
    const queryVector = new Float32Array([0.01, 0.02, 0.03]);
    dao.searchDocumentSemantic.mockResolvedValue(semantic);

    const result = await repo.searchDocumentSemantic(queryVector);

    expect(dao.searchDocumentSemantic).toHaveBeenCalledWith(queryVector);
    expect(result).toHaveLength(1);
    expect(result[0].document.getUuid()).toBe("doc-uuid");
    expect(result[0].score).toBe(0.8);
  });

  it("getIndexedDocumentsCount delega al DAO", () => {
    dao.getIndexedDocumentsCount.mockReturnValue(42);

    const count = repo.getIndexedDocumentsCount();

    expect(dao.getIndexedDocumentsCount).toHaveBeenCalledTimes(1);
    expect(count).toBe(42);
  });
});
