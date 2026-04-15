import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProcessPersistenceAdapter } from "../../../src/repo/impl/ProcessPersistenceAdapter";
import { ProcessDAO } from "../../../src/dao/ProcessDAO";
import { Process } from "../../../src/entity/Process";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";
import { Metadata, MetadataType } from "../../../src/value-objects/Metadata";

describe("ProcessPersistenceAdapter", () => {
  let dao: {
    getById: ReturnType<typeof vi.fn>;
    getByDocumentClassId: ReturnType<typeof vi.fn>;
    getByStatus: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    updateIntegrityStatus: ReturnType<typeof vi.fn>;
    getAggregatedIntegrityStatusByDocumentClassId: ReturnType<typeof vi.fn>;
  };
  let repo: ProcessPersistenceAdapter;

  beforeEach(() => {
    dao = {
      getById: vi.fn(),
      getByDocumentClassId: vi.fn(),
      getByStatus: vi.fn(),
      save: vi.fn(),
      updateIntegrityStatus: vi.fn(),
      getAggregatedIntegrityStatusByDocumentClassId: vi.fn(),
    };
    repo = new ProcessPersistenceAdapter(dao as unknown as ProcessDAO);
  });

  const metadata = new Metadata(
    "root",
    [new Metadata("fase", "A", MetadataType.STRING)],
    MetadataType.COMPOSITE,
  );

  it("TU-F-browsing-68: save() should save persiste processo e metadata", () => {
    const input = new Process("dc-uuid", "proc-1", metadata);
    const saved = new Process(
      "dc-uuid",
      "proc-1",
      metadata,
      IntegrityStatusEnum.UNKNOWN,
      81,
      11,
    );
    dao.save.mockReturnValue(saved);

    const result = repo.save(input);

    expect(dao.save).toHaveBeenCalledWith(input);
    expect(result.getId()).toBe(81);
    expect(result.getDocumentClassId()).toBe(11);
  });

  it("TU-F-browsing-69: getByDocumentClassId() should getByDocumentClassId, getByStatus e updateIntegrityStatus funzionano", () => {
    const rows = [
      new Process(
        "dc-uuid",
        "proc-2",
        metadata,
        IntegrityStatusEnum.VALID,
        82,
        12,
      ),
    ];
    dao.getByDocumentClassId.mockReturnValue(rows);
    dao.getByStatus.mockReturnValue(rows);

    expect(repo.getByDocumentClassId(12)).toHaveLength(1);

    repo.updateIntegrityStatus(82, IntegrityStatusEnum.VALID);
    const byStatus = repo.getByStatus(IntegrityStatusEnum.VALID);

    expect(dao.updateIntegrityStatus).toHaveBeenCalledWith(
      82,
      IntegrityStatusEnum.VALID,
    );
    expect(dao.getByStatus).toHaveBeenCalledWith(IntegrityStatusEnum.VALID);
    expect(byStatus).toHaveLength(1);
    expect(byStatus[0].getUuid()).toBe("proc-2");
  });
});
