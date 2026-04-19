import { beforeEach, describe, expect, it, vi } from "vitest";

import { DocumentPersistenceAdapter } from "../../../src/repo/impl/DocumentPersistenceAdapter";
import { DocumentDAO } from "../../../src/dao/DocumentDAO";
import { DocumentJsonPersistenceRow } from "../../../src/dao/mappers/DocumentMapper";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";

describe("searchDocumentSemantic — delega al DAO", () => {
  let dao: {
    searchDocumentSemantic: ReturnType<typeof vi.fn>;
  };
  let repo: DocumentPersistenceAdapter;

  beforeEach(() => {
    dao = {
      searchDocumentSemantic: vi.fn(),
    };

    repo = new DocumentPersistenceAdapter(dao as unknown as DocumentDAO);
  });

  const createRow = (id: number, uuid: string): DocumentJsonPersistenceRow => ({
    id,
    uuid,
    integrityStatus: IntegrityStatusEnum.UNKNOWN,
    processId: 1,
    processUuid: "proc-1",
    metadataJson: '{"root":{"nome":"Documento"}}',
  });

  it("propaga la query invariata al DAO", async () => {
    dao.searchDocumentSemantic.mockResolvedValue([]);
    const queryVector = new Float32Array([0.1, 0.2, 0.3]);

    await repo.searchDocumentSemantic(queryVector);

    expect(dao.searchDocumentSemantic).toHaveBeenCalledWith(queryVector);
    expect(dao.searchDocumentSemantic).toHaveBeenCalledTimes(1);
  });

  it("ritorna i risultati semantici senza alterazioni", async () => {
    const semanticResults = [
      {
        row: createRow(1, "doc-1"),
        score: 0.91,
      },
      {
        row: createRow(2, "doc-2"),
        score: 0.77,
      },
    ];

    dao.searchDocumentSemantic.mockResolvedValue(semanticResults);

    const result = await repo.searchDocumentSemantic(
      new Float32Array([0.4, 0.5, 0.6]),
    );

    expect(result).toHaveLength(2);
    expect(result[0].score).toBe(0.91);
    expect(result[1].document.getUuid()).toBe("doc-2");
  });

  it("propaga errori sollevati dal DAO", async () => {
    dao.searchDocumentSemantic.mockRejectedValue(new Error("semantic failed"));

    await expect(
      repo.searchDocumentSemantic(new Float32Array([0.7, 0.8, 0.9])),
    ).rejects.toThrow("semantic failed");
  });

  it("supporta chiamate multiple indipendenti", async () => {
    dao.searchDocumentSemantic
      .mockResolvedValueOnce([
        {
          row: createRow(10, "doc-a"),
          score: 0.5,
        },
      ])
      .mockResolvedValueOnce([]);

    const first = await repo.searchDocumentSemantic(
      new Float32Array([1, 2, 3]),
    );
    const second = await repo.searchDocumentSemantic(
      new Float32Array([4, 5, 6]),
    );

    expect(first).toHaveLength(1);
    expect(second).toHaveLength(0);
    expect(dao.searchDocumentSemantic).toHaveBeenCalledTimes(2);
  });
});
