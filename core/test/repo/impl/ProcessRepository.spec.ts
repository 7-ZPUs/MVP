import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProcessRepository } from "../../../src/repo/impl/ProcessRepository";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";
import { Process } from "../../../src/entity/Process";
import { Metadata, MetadataType } from "../../../src/value-objects/Metadata";

describe("ProcessRepository", () => {
  const dao = {
    save: vi.fn(),
    getByDocumentClassId: vi.fn(),
    getByStatus: vi.fn(),
    getById: vi.fn(),
    updateIntegrityStatus: vi.fn(),
    getAggregatedIntegrityStatusByDocumentClassId: vi.fn(),
  };

  let repo: ProcessRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new ProcessRepository(dao as any);
  });

  it("delegates save and getById", () => {
    const metadata = new Metadata("root", [], MetadataType.COMPOSITE);
    const input = new Process("class-uuid", "proc-1", metadata);
    const out = new Process(
      "class-uuid",
      "proc-1",
      metadata,
      IntegrityStatusEnum.UNKNOWN,
      1,
      10,
    );
    dao.save.mockReturnValue(out);
    dao.getById.mockReturnValue(out);

    expect(repo.save(input)).toBe(out);
    expect(repo.getById(1)).toBe(out);
    expect(dao.save).toHaveBeenCalledWith(input);
    expect(dao.getById).toHaveBeenCalledWith(1);
  });

  it("delegates getByDocumentClassId and getByStatus", () => {
    const list = [
      new Process(
        "class-uuid",
        "proc-2",
        new Metadata("root", [], MetadataType.COMPOSITE),
        IntegrityStatusEnum.VALID,
        2,
        10,
      ),
    ];
    dao.getByDocumentClassId.mockReturnValue(list);
    dao.getByStatus.mockReturnValue(list);

    expect(repo.getByDocumentClassId(10)).toBe(list);
    expect(repo.getByStatus(IntegrityStatusEnum.VALID)).toBe(list);
    expect(dao.getByDocumentClassId).toHaveBeenCalledWith(10);
    expect(dao.getByStatus).toHaveBeenCalledWith(IntegrityStatusEnum.VALID);
  });

  it("delegates update and aggregated status", () => {
    dao.getAggregatedIntegrityStatusByDocumentClassId.mockReturnValue(
      IntegrityStatusEnum.INVALID,
    );

    repo.updateIntegrityStatus(3, IntegrityStatusEnum.UNKNOWN);
    expect(repo.getAggregatedIntegrityStatusByDocumentClassId(10)).toBe(
      IntegrityStatusEnum.INVALID,
    );

    expect(dao.updateIntegrityStatus).toHaveBeenCalledWith(
      3,
      IntegrityStatusEnum.UNKNOWN,
    );
    expect(dao.getAggregatedIntegrityStatusByDocumentClassId).toHaveBeenCalledWith(
      10,
    );
  });
});
