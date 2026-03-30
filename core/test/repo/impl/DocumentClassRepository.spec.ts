import { beforeEach, describe, expect, it, vi } from "vitest";

import { DocumentClassRepository } from "../../../src/repo/impl/DocumentClassRepository";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";
import { DocumentClass } from "../../../src/entity/DocumentClass";

describe("DocumentClassRepository", () => {
  const dao = {
    getById: vi.fn(),
    getByDipId: vi.fn(),
    getByStatus: vi.fn(),
    save: vi.fn(),
    search: vi.fn(),
    updateIntegrityStatus: vi.fn(),
    getAggregatedIntegrityStatusByDipId: vi.fn(),
  };

  let repo: DocumentClassRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new DocumentClassRepository(dao as any);
  });

  it("delegates getById", () => {
    const entity = new DocumentClass(
      "dip-uuid",
      "dc-1",
      "Classe",
      "2026-01-01",
      IntegrityStatusEnum.UNKNOWN,
      1,
      2,
    );
    dao.getById.mockReturnValue(entity);

    expect(repo.getById(1)).toBe(entity);
    expect(dao.getById).toHaveBeenCalledWith(1);
  });

  it("delegates getByDipId and getByStatus", () => {
    const list = [
      new DocumentClass(
        "dip-uuid",
        "dc-2",
        "Classe",
        "2026-01-01",
        IntegrityStatusEnum.VALID,
        3,
        4,
      ),
    ];
    dao.getByDipId.mockReturnValue(list);
    dao.getByStatus.mockReturnValue(list);

    expect(repo.getByDipId(4)).toBe(list);
    expect(repo.getByStatus(IntegrityStatusEnum.VALID)).toBe(list);
    expect(dao.getByDipId).toHaveBeenCalledWith(4);
    expect(dao.getByStatus).toHaveBeenCalledWith(IntegrityStatusEnum.VALID);
  });

  it("delegates save and search", () => {
    const input = new DocumentClass("dip-uuid", "dc-3", "Verbali", "2026-01-01");
    const output = new DocumentClass(
      "dip-uuid",
      "dc-3",
      "Verbali",
      "2026-01-01",
      IntegrityStatusEnum.UNKNOWN,
      5,
      6,
    );

    dao.save.mockReturnValue(output);
    dao.search.mockReturnValue([output]);

    expect(repo.save(input)).toBe(output);
    expect(repo.search("Verb")).toEqual([output]);
    expect(dao.save).toHaveBeenCalledWith(input);
    expect(dao.search).toHaveBeenCalledWith("Verb");
  });

  it("delegates update and aggregated status", () => {
    dao.getAggregatedIntegrityStatusByDipId.mockReturnValue(
      IntegrityStatusEnum.INVALID,
    );

    repo.updateIntegrityStatus(7, IntegrityStatusEnum.VALID);
    expect(repo.getAggregatedIntegrityStatusByDipId(9)).toBe(
      IntegrityStatusEnum.INVALID,
    );

    expect(dao.updateIntegrityStatus).toHaveBeenCalledWith(
      7,
      IntegrityStatusEnum.VALID,
    );
    expect(dao.getAggregatedIntegrityStatusByDipId).toHaveBeenCalledWith(9);
  });
});
