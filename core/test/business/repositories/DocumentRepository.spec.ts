import { beforeEach, describe, expect, it, vi } from "vitest";

import { DocumentRepository } from "../../../src/repo/impl/DocumentRepository";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";
import { DatabaseProvider } from "../../../src/repo/impl/DatabaseProvider";
import { Document } from "../../../src/entity/Document";
import { Metadata, MetadataType } from "../../../src/value-objects/Metadata";

describe("DocumentRepository", () => {
  const makeDb = () => ({
    exec: vi.fn(),
    prepare: vi.fn(),
  });

  let db: ReturnType<typeof makeDb>;
  let repo: DocumentRepository;

  beforeEach(() => {
    db = makeDb();
    repo = new DocumentRepository({ db } as unknown as DatabaseProvider);
  });

  it("save persiste documento e metadata", () => {
    const insertMetadataRun = vi.fn().mockReturnValue({ lastInsertRowid: 1 });
    const deleteMetadataRun = vi.fn();
    const getDoc = vi.fn().mockReturnValue({
      id: 51,
      uuid: "doc-1",
      integrityStatus: IntegrityStatusEnum.UNKNOWN,
      processId: 7,
    });
    const loadMetadataAll = vi.fn().mockReturnValue([
      {
        id: 1,
        document_id: 51,
        parent_id: null,
        name: "titolo",
        value: "Documento A",
        type: "string",
      },
      {
        id: 2,
        document_id: 51,
        parent_id: null,
        name: "anno",
        value: "2026",
        type: "number",
      },
    ]);

    db.prepare.mockImplementation((query: string) => {
      const isInsertEntity = query.includes("INSERT INTO document");
      const isDeleteMeta = query.includes("DELETE FROM document_metadata");
      const isInsertMeta = query.includes("INSERT INTO document_metadata");
      const isSelectEntity = query.includes("FROM document WHERE id = ?");
      const isSelectMeta = query.includes(
        "FROM document_metadata WHERE document_id = ?",
      );

      return {
        run: isInsertMeta
          ? insertMetadataRun
          : isDeleteMeta
            ? deleteMetadataRun
            : vi.fn().mockImplementation(() => {
                if (isInsertEntity) return { lastInsertRowid: 51 };
                return {};
              }),
        get: vi.fn().mockImplementation(() => {
          if (isSelectEntity) return getDoc();
          return null;
        }),
        all: vi.fn().mockImplementation(() => {
          if (isSelectMeta) return loadMetadataAll();
          return [];
        }),
      };
    });

    const metadata = [
      new Metadata("titolo", "Documento A", MetadataType.STRING),
      new Metadata("anno", "2026", MetadataType.NUMBER),
    ];

    const document = new Document("doc-1", metadata, "process-uuid");

    const saved = repo.save(document);
    const found = repo.getById(saved.toDTO().id);

    expect(found).not.toBeNull();
    expect(found?.getUuid()).toBe("doc-1");
    expect(found?.getProcessId()).toBe(7);
    expect(found?.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
    expect(found?.getMetadata()).toHaveLength(2);
    expect(found?.getMetadata()[0].name).toBe("titolo");
    expect(insertMetadataRun).toHaveBeenCalledTimes(2);
  });

  it("getByProcessId, getByStatus e updateIntegrityStatus funzionano", () => {
    const run = vi.fn();
    const row = {
      id: 61,
      uuid: "doc-2",
      integrityStatus: IntegrityStatusEnum.VALID,
      processId: 8,
    };

    db.prepare
      .mockReturnValueOnce({ all: vi.fn().mockReturnValue([row]) })
      .mockReturnValueOnce({ all: vi.fn().mockReturnValue([]) })
      .mockReturnValueOnce({ run })
      .mockReturnValueOnce({ all: vi.fn().mockReturnValue([row]) })
      .mockReturnValueOnce({ all: vi.fn().mockReturnValue([]) });

    expect(repo.getByProcessId(8)).toHaveLength(1);

    repo.updateIntegrityStatus(61, IntegrityStatusEnum.VALID);
    const byStatus = repo.getByStatus(IntegrityStatusEnum.VALID);

    expect(run).toHaveBeenCalledWith(IntegrityStatusEnum.VALID, 61);
    expect(byStatus).toHaveLength(1);
    expect(byStatus[0].getUuid()).toBe("doc-2");
    expect(byStatus[0].getIntegrityStatus()).toBe(IntegrityStatusEnum.VALID);
  });
});
