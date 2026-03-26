import { describe, expect, it, vi } from "vitest";

import { GetDipByIdUC } from "../../../src/use-case/dip/impl/GetDipByIdUC";
import { GetDipByStatusUC } from "../../../src/use-case/dip/impl/GetDipByStatusUC";
import { CheckDipIntegrityStatusUC } from "../../../src/use-case/dip/impl/CheckDipIntegrityStatusUC";
import { Dip } from "../../../src/entity/Dip";
import { IDipRepository } from "../../../src/repo/IDipRepository";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";
import { IDocumentClassRepository } from "../../../src/repo/IDocumentClassRepository";

describe("Dip use-cases", () => {
  it("TU-F-B-16: GetDipByIdUC.execute() with a valid ID should return the correct dip", () => {
    const dip = new Dip("dip-id");
    const repo: Pick<IDipRepository, "getById"> = {
      getById: vi.fn().mockReturnValue(dip),
    };

    const uc = new GetDipByIdUC(repo as IDipRepository);
    const result = uc.execute(10);

    expect(repo.getById).toHaveBeenCalledWith(10);
    expect(result).toBe(dip);
  });

  it("TU-F-B-17: GetDipByIdUC.execute() with a non-existent ID should return null", () => {
    const repo: Pick<IDipRepository, "getById"> = {
      getById: vi.fn().mockReturnValue(null),
    };

    const uc = new GetDipByIdUC(repo as IDipRepository);
    const result = uc.execute(999);

    expect(repo.getById).toHaveBeenCalledWith(999);
    expect(result).toBeNull();
  });

  it("TU-F-B-18: GetDipByStatusUC.execute() with a matching status should return an array of dips", () => {
    const list = [new Dip("a"), new Dip("b")];
    const repo: Pick<IDipRepository, "getByStatus"> = {
      getByStatus: vi.fn().mockReturnValue(list),
    };

    const uc = new GetDipByStatusUC(repo as IDipRepository);
    const result = uc.execute(IntegrityStatusEnum.VALID);

    expect(repo.getByStatus).toHaveBeenCalledWith(IntegrityStatusEnum.VALID);
    expect(result).toBe(list);
  });

  it("TU-F-B-19: GetDipByStatusUC.execute() with no matching status should return an empty array", () => {
    const repo: Pick<IDipRepository, "getByStatus"> = {
      getByStatus: vi.fn().mockReturnValue([]),
    };

    const uc = new GetDipByStatusUC(repo as IDipRepository);
    const result = uc.execute(IntegrityStatusEnum.INVALID);

    expect(repo.getByStatus).toHaveBeenCalledWith(IntegrityStatusEnum.INVALID);
    expect(result).toEqual([]);
  });

  it("TU-F-B-20: CheckDipIntegrityStatusUC.execute() with valid ID should successfully update and return the newly aggregated status", () => {
    const dipRepo: Pick<IDipRepository, "getById" | "updateIntegrityStatus"> = {
      getById: vi.fn().mockReturnValue(new Dip("dip-1")),
      updateIntegrityStatus: vi.fn(),
    };
    const docClassRepo: Pick<IDocumentClassRepository, "getAggregatedIntegrityStatusByDipId"> = {
      getAggregatedIntegrityStatusByDipId: vi.fn().mockReturnValue(IntegrityStatusEnum.VALID),
    };

    const uc = new CheckDipIntegrityStatusUC(
      dipRepo as IDipRepository,
      docClassRepo as IDocumentClassRepository,
    );
    const result = uc.execute(1);

    expect(docClassRepo.getAggregatedIntegrityStatusByDipId).toHaveBeenCalledWith(1);
    expect(dipRepo.updateIntegrityStatus).toHaveBeenCalledWith(1, IntegrityStatusEnum.VALID);
    expect(result).toBe(IntegrityStatusEnum.VALID);
  });

  it("TU-F-B-21: CheckDipIntegrityStatusUC.execute() with non-existent dip ID should throw an error", () => {
    const dipRepo: Pick<IDipRepository, "getById" | "updateIntegrityStatus"> = {
      getById: vi.fn().mockReturnValue(null),
      updateIntegrityStatus: vi.fn(),
    };
    const docClassRepo: Pick<IDocumentClassRepository, "getAggregatedIntegrityStatusByDipId"> = {
      getAggregatedIntegrityStatusByDipId: vi.fn(),
    };

    const uc = new CheckDipIntegrityStatusUC(
      dipRepo as IDipRepository,
      docClassRepo as IDocumentClassRepository,
    );

    expect(() => uc.execute(3)).toThrow("Dip with id 3 not found");
    expect(dipRepo.updateIntegrityStatus).not.toHaveBeenCalled();
  });
});
