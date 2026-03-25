import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProcessRepository } from "../../../src/repo/impl/ProcessRepository";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";
import { DatabaseProvider } from "../../../src/repo/impl/DatabaseProvider";
import { Process } from "../../../src/entity/Process";
import { Metadata, MetadataType } from "../../../src/value-objects/Metadata";

describe("ProcessRepository", () => {
  const makeDb = () => ({
    exec: vi.fn(),
    prepare: vi.fn(),
  });

  let db: ReturnType<typeof makeDb>;
  let repo: ProcessRepository;

  beforeEach(() => {
    db = makeDb();
    repo = new ProcessRepository({ db } as unknown as DatabaseProvider);
  });

  it("save persiste processo e metadata", () => {
    const insertProcessRun = vi.fn().mockReturnValue({ lastInsertRowid: 81 });
    const insertMetadataRun = vi.fn();
    const deleteMetadataRun = vi.fn();
    const getProcess = vi.fn().mockReturnValue({
      id: 81,
      documentClassId: 11,
      uuid: "proc-1",
      integrityStatus: IntegrityStatusEnum.UNKNOWN,
    });
    const loadMetadataAll = vi.fn().mockReturnValue([
      { id: 1, process_id: 81, name: "fase", value: "A", type: "string" },
      { id: 2, process_id: 81, name: "ordine", value: "1", type: "number" },
    ]);

    db.prepare.mockImplementation((query: string) => {
      const isInsertEntity = query.includes("INSERT INTO process");
      const isDeleteMeta = query.includes("DELETE FROM process_metadata");
      const isInsertMeta = query.includes("INSERT INTO process_metadata");
      const isSelectEntity = query.includes("FROM process WHERE id = ?");
      const isSelectMeta = query.includes("FROM process_metadata WHERE process_id = ?");

      return {
        run: isInsertMeta ? insertMetadataRun : (isDeleteMeta ? deleteMetadataRun : vi.fn().mockImplementation(() => {
          if (isInsertEntity) return { lastInsertRowid: 81 };
          return {};
        })),
        get: vi.fn().mockImplementation(() => {
          if (isSelectEntity) return getProcess();
          return null;
        }),
        all: vi.fn().mockImplementation(() => {
          if (isSelectMeta) return loadMetadataAll();
          return [];
        })
      };
    });


    const metadata = [
      new Metadata("fase", "A", MetadataType.STRING),
      new Metadata("ordine", "1", MetadataType.NUMBER),
    ];

    const process = new Process("dc-uuid", "proc-1", metadata);

    const saved = repo.save(process);
    const found = repo.getById(saved.toDTO().id);

    expect(found).not.toBeNull();
    expect(found?.getDocumentClassId()).toBe(11);
    expect(found?.getUuid()).toBe("proc-1");
    expect(found?.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
    expect(found?.getMetadata()).toHaveLength(2);
    expect(found?.getMetadata()[0].name).toBe("fase");
    expect(insertMetadataRun).toHaveBeenCalledTimes(2);
  });

  it("getByDocumentClassId, getByStatus e updateIntegrityStatus funzionano", () => {
    const run = vi.fn();
    const row = {
      id: 82,
      documentClassId: 12,
      uuid: "proc-2",
      integrityStatus: IntegrityStatusEnum.VALID,
    };

    db.prepare
      .mockReturnValueOnce({ all: vi.fn().mockReturnValue([row]) })
      .mockReturnValueOnce({ all: vi.fn().mockReturnValue([]) })
      .mockReturnValueOnce({ run })
      .mockReturnValueOnce({ all: vi.fn().mockReturnValue([row]) })
      .mockReturnValueOnce({ all: vi.fn().mockReturnValue([]) });

    expect(repo.getByDocumentClassId(12)).toHaveLength(1);

    repo.updateIntegrityStatus(82, IntegrityStatusEnum.VALID);
    const byStatus = repo.getByStatus(IntegrityStatusEnum.VALID);

    expect(run).toHaveBeenCalledWith(IntegrityStatusEnum.VALID, 82);
    expect(byStatus).toHaveLength(1);
    expect(byStatus[0].getUuid()).toBe("proc-2");
    expect(byStatus[0].getIntegrityStatus()).toBe(IntegrityStatusEnum.VALID);
  });
});
