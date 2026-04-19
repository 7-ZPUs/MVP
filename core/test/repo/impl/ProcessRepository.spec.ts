import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProcessPersistenceAdapter } from "../../../src/repo/impl/ProcessPersistenceAdapter";
import {
  ProcessDAO,
  ProcessPersistenceAggregate,
} from "../../../src/dao/ProcessDAO";
import { Process } from "../../../src/entity/Process";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";
import { Metadata, MetadataType } from "../../../src/value-objects/Metadata";
import { MetadataPersistenceRow } from "../../../src/dao/mappers/MetadataMapper";

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

  const createAggregate = (
    id: number,
    uuid: string,
  ): ProcessPersistenceAggregate => {
    const metadataRows: MetadataPersistenceRow[] = [
      {
        id: 1,
        parent_id: null,
        name: "root",
        value: "",
        type: MetadataType.COMPOSITE,
      },
      {
        id: 2,
        parent_id: 1,
        name: "fase",
        value: "A",
        type: MetadataType.STRING,
      },
    ];

    return {
      row: {
        id,
        documentClassId: 11,
        documentClassUuid: "dc-uuid",
        uuid,
        integrityStatus: IntegrityStatusEnum.UNKNOWN,
      },
      metadata: metadataRows,
    };
  };

  it("TU-F-browsing-68: save() should save persiste processo e metadata", () => {
    const input = new Process("dc-uuid", "proc-1", metadata);
    dao.save.mockReturnValue(createAggregate(81, "proc-1"));

    const result = repo.save(input);

    expect(dao.save).toHaveBeenCalledWith(input);
    expect(result.getId()).toBe(81);
    expect(result.getDocumentClassId()).toBe(11);
  });

  it("TU-F-browsing-69: getByDocumentClassId() should getByDocumentClassId, getByStatus e updateIntegrityStatus funzionano", () => {
    const rows = [createAggregate(82, "proc-2")];
    rows[0].row.integrityStatus = IntegrityStatusEnum.VALID;
    rows[0].row.documentClassId = 12;
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
