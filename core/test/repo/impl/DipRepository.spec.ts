import { beforeEach, describe, expect, it, vi } from "vitest";

import { DipRepository } from "../../../src/repo/impl/DipRepository";
import { Dip } from "../../../src/entity/Dip";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";

describe("DipRepository", () => {
  const dao = {
    getById: vi.fn(),
    getByUuid: vi.fn(),
    save: vi.fn(),
    getByStatus: vi.fn(),
    updateIntegrityStatus: vi.fn(),
  };

  let repo: DipRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new DipRepository(dao as any);
  });

  it("delegates getById", () => {
    const dip = new Dip("dip-1", IntegrityStatusEnum.UNKNOWN, 1);
    dao.getById.mockReturnValue(dip);

    expect(repo.getById(1)).toBe(dip);
    expect(dao.getById).toHaveBeenCalledWith(1);
  });

  it("delegates getByUuid", () => {
    const dip = new Dip("dip-2", IntegrityStatusEnum.UNKNOWN, 2);
    dao.getByUuid.mockReturnValue(dip);

    expect(repo.getByUuid("dip-2")).toBe(dip);
    expect(dao.getByUuid).toHaveBeenCalledWith("dip-2");
  });

  it("delegates save", () => {
    const input = new Dip("dip-3");
    const output = new Dip("dip-3", IntegrityStatusEnum.UNKNOWN, 3);
    dao.save.mockReturnValue(output);

    expect(repo.save(input)).toBe(output);
    expect(dao.save).toHaveBeenCalledWith(input);
  });

  it("delegates getByStatus", () => {
    const list = [new Dip("dip-4", IntegrityStatusEnum.VALID, 4)];
    dao.getByStatus.mockReturnValue(list);

    expect(repo.getByStatus(IntegrityStatusEnum.VALID)).toBe(list);
    expect(dao.getByStatus).toHaveBeenCalledWith(IntegrityStatusEnum.VALID);
  });

  it("delegates updateIntegrityStatus", () => {
    repo.updateIntegrityStatus(5, IntegrityStatusEnum.INVALID);
    expect(dao.updateIntegrityStatus).toHaveBeenCalledWith(
      5,
      IntegrityStatusEnum.INVALID,
    );
  });
});
