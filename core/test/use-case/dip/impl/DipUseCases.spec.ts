import { describe, expect, it, vi } from "vitest";

import { GetDipByIdUC } from "../../../../src/use-case/dip/impl/GetDipByIdUC";
import { GetDipByStatusUC } from "../../../../src/use-case/dip/impl/GetDipByStatusUC";
import { CheckDipIntegrityStatusUC } from "../../../../src/use-case/dip/impl/CheckDipIntegrityStatusUC";
import { Dip } from "../../../../src/entity/Dip";
import { IDipRepository } from "../../../../src/repo/IDipRepository";
import { IntegrityStatusEnum } from "../../../../src/value-objects/IntegrityStatusEnum";
import { IIntegrityVerificationService } from "../../../../src/services/IIntegrityVerificationService";

describe("Dip use-cases", () => {
  // identifier: TU-S-browsing-85
  // method_name: execute()
  // description: should return the correct dip
  // expected_value: returns the correct dip
  it("TU-S-browsing-85: execute() should return the correct dip", () => {
    const dip = new Dip("dip-id");
    const repo: Pick<IDipRepository, "getById"> = {
      getById: vi.fn().mockReturnValue(dip),
    };

    const uc = new GetDipByIdUC(repo as IDipRepository);
    const result = uc.execute(10);

    expect(repo.getById).toHaveBeenCalledWith(10);
    expect(result).toBe(dip);
  });

  // identifier: TU-S-browsing-86
  // method_name: execute()
  // description: should return null
  // expected_value: returns null
  it("TU-S-browsing-86: execute() should return null", () => {
    const repo: Pick<IDipRepository, "getById"> = {
      getById: vi.fn().mockReturnValue(null),
    };

    const uc = new GetDipByIdUC(repo as IDipRepository);
    const result = uc.execute(999);

    expect(repo.getById).toHaveBeenCalledWith(999);
    expect(result).toBeNull();
  });

  // identifier: TU-S-browsing-87
  // method_name: execute()
  // description: should return an array of dips
  // expected_value: returns an array of dips
  it("TU-S-browsing-87: execute() should return an array of dips", () => {
    const list = [new Dip("a"), new Dip("b")];
    const repo: Pick<IDipRepository, "getByStatus"> = {
      getByStatus: vi.fn().mockReturnValue(list),
    };

    const uc = new GetDipByStatusUC(repo as IDipRepository);
    const result = uc.execute(IntegrityStatusEnum.VALID);

    expect(repo.getByStatus).toHaveBeenCalledWith(IntegrityStatusEnum.VALID);
    expect(result).toBe(list);
  });

  // identifier: TU-S-browsing-88
  // method_name: execute()
  // description: should return an empty array
  // expected_value: returns an empty array
  it("TU-S-browsing-88: execute() should return an empty array", () => {
    const repo: Pick<IDipRepository, "getByStatus"> = {
      getByStatus: vi.fn().mockReturnValue([]),
    };

    const uc = new GetDipByStatusUC(repo as IDipRepository);
    const result = uc.execute(IntegrityStatusEnum.INVALID);

    expect(repo.getByStatus).toHaveBeenCalledWith(IntegrityStatusEnum.INVALID);
    expect(result).toEqual([]);
  });

  // identifier: TU-S-browsing-89
  // method_name: execute()
  // description: should successfully delegate and return the resulting status
  // expected_value: matches asserted behavior: successfully delegate and return the resulting status
  it("TU-S-browsing-89: execute() should successfully update and return the newly aggregated status", async () => {
    const integrityService: Pick<
      IIntegrityVerificationService,
      "checkDipIntegrityStatus"
    > = {
      checkDipIntegrityStatus: vi
        .fn()
        .mockResolvedValue(IntegrityStatusEnum.VALID),
    };

    const uc = new CheckDipIntegrityStatusUC(
      integrityService as IIntegrityVerificationService,
    );
    const result = await uc.execute(1);

    expect(integrityService.checkDipIntegrityStatus).toHaveBeenCalledWith(1);
    expect(result).toBe(IntegrityStatusEnum.VALID);
  });

  // identifier: TU-S-browsing-90
  // method_name: execute()
  // description: should throw an error
  // expected_value: throws an error
  it("TU-S-browsing-90: execute() should throw an error", async () => {
    const integrityService: Pick<
      IIntegrityVerificationService,
      "checkDipIntegrityStatus"
    > = {
      checkDipIntegrityStatus: vi
        .fn()
        .mockRejectedValue(new Error("Dip with id 3 not found")),
    };

    const uc = new CheckDipIntegrityStatusUC(
      integrityService as IIntegrityVerificationService,
    );

    await expect(uc.execute(3)).rejects.toThrow("Dip with id 3 not found");
  });
});
