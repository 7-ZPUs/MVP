import { describe, expect, it, vi } from "vitest";

import { GetDipByIdUC } from "../../../src/use-case/dip/impl/GetDipByIdUC";
import { GetDipByStatusUC } from "../../../src/use-case/dip/impl/GetDipByStatusUC";
import { Dip } from "../../../src/entity/Dip";
import { IDipRepository } from "../../../src/repo/IDipRepository";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";

describe("Dip use-cases", () => {
  it("GetDipByIdUC delega a repo.getById", () => {
    const dip = new Dip("dip-id");
    const repo: Pick<IDipRepository, "getById"> = {
      getById: vi.fn().mockReturnValue(dip),
    };

    const uc = new GetDipByIdUC(repo as IDipRepository);
    const result = uc.execute(10);

    expect(repo.getById).toHaveBeenCalledWith(10);
    expect(result).toBe(dip);
  });

  it("GetDipByStatusUC delega a repo.getByStatus", () => {
    const list = [new Dip("a"), new Dip("b")];
    const repo: Pick<IDipRepository, "getByStatus"> = {
      getByStatus: vi.fn().mockReturnValue(list),
    };

    const uc = new GetDipByStatusUC(repo as IDipRepository);
    const result = uc.execute(IntegrityStatusEnum.VALID);

    expect(repo.getByStatus).toHaveBeenCalledWith(IntegrityStatusEnum.VALID);
    expect(result).toBe(list);
  });
});
