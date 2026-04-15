import { describe, expect, it, vi } from "vitest";

import { GetProcessByIdUC } from "../../../../src/use-case/process/impl/GetProcessByIdUC";
import { GetProcessByDocumentClassUC } from "../../../../src/use-case/process/impl/GetProcessByDocumentClassUC";
import { GetProcessByStatusUC } from "../../../../src/use-case/process/impl/GetProcessByStatus";
import { CheckProcessIntegrityStatusUC } from "../../../../src/use-case/process/impl/CheckProcessIntegrityStatusUC";
import { Process } from "../../../../src/entity/Process";
import {
  IGetProcessByDocumentClassIdPort,
  IGetProcessByIdPort,
  IGetProcessByStatusPort,
} from "../../../../src/repo/IProcessRepository";
import { IntegrityStatusEnum } from "../../../../src/value-objects/IntegrityStatusEnum";
import { IIntegrityVerificationService } from "../../../../src/services/IIntegrityVerificationService";
import { Metadata, MetadataType } from "../../../../src/value-objects/Metadata";

function buildProcessMetadata(): Metadata {
  return new Metadata("root", [], MetadataType.COMPOSITE);
}

describe("Process use-cases", () => {
  // identifier: TU-S-browsing-102
  // method_name: execute()
  // description: should return the correct process
  // expected_value: returns the correct process
  it("TU-S-browsing-102: execute() should return the correct process", () => {
    const entity = new Process("dc-uuid", "proc-2", buildProcessMetadata());
    const repo: IGetProcessByIdPort = {
      getById: vi.fn().mockReturnValue(entity),
    };

    const uc = new GetProcessByIdUC(repo);
    const result = uc.execute(12);

    expect(repo.getById).toHaveBeenCalledWith(12);
    expect(result).toBe(entity);
  });

  // identifier: TU-S-browsing-103
  // method_name: execute()
  // description: should return list of processes
  // expected_value: returns list of processes
  it("TU-S-browsing-103: execute() should return list of processes", () => {
    const list = [new Process("dc-uuid", "proc-3", buildProcessMetadata())];
    const repo: IGetProcessByDocumentClassIdPort = {
      getByDocumentClassId: vi.fn().mockReturnValue(list),
    };

    const uc = new GetProcessByDocumentClassUC(repo);
    const result = uc.execute(3);

    expect(repo.getByDocumentClassId).toHaveBeenCalledWith(3);
    expect(result).toBe(list);
  });

  // identifier: TU-S-browsing-104
  // method_name: execute()
  // description: should return list of processes
  // expected_value: returns list of processes
  it("TU-S-browsing-104: execute() should return list of processes", () => {
    const list = [new Process("dc-uuid", "proc-4", buildProcessMetadata())];
    const repo: IGetProcessByStatusPort = {
      getByStatus: vi.fn().mockReturnValue(list),
    };

    const uc = new GetProcessByStatusUC(repo);
    const result = uc.execute(IntegrityStatusEnum.VALID);

    expect(repo.getByStatus).toHaveBeenCalledWith(IntegrityStatusEnum.VALID);
    expect(result).toBe(list);
  });

  // identifier: TU-S-browsing-105
  // method_name: execute()
  // description: should delegate and return service status
  // expected_value: updates state as asserted: delegate and return service status
  it("TU-S-browsing-105: execute() should update and return aggregated status", async () => {
    const integrityService: Pick<
      IIntegrityVerificationService,
      "checkProcessIntegrityStatus"
    > = {
      checkProcessIntegrityStatus: vi
        .fn()
        .mockResolvedValue(IntegrityStatusEnum.VALID),
    };

    const uc = new CheckProcessIntegrityStatusUC(
      integrityService as IIntegrityVerificationService,
    );
    const result = await uc.execute(1);

    expect(integrityService.checkProcessIntegrityStatus).toHaveBeenCalledWith(
      1,
    );
    expect(result).toBe(IntegrityStatusEnum.VALID);
  });

  // identifier: TU-S-browsing-106
  // method_name: execute()
  // description: should throw an error
  // expected_value: throws an error
  it("TU-S-browsing-106: execute() should throw an error", async () => {
    const integrityService: Pick<
      IIntegrityVerificationService,
      "checkProcessIntegrityStatus"
    > = {
      checkProcessIntegrityStatus: vi
        .fn()
        .mockRejectedValue(new Error("Process with id 55 not found")),
    };

    const uc = new CheckProcessIntegrityStatusUC(
      integrityService as IIntegrityVerificationService,
    );

    await expect(uc.execute(55)).rejects.toThrow(
      "Process with id 55 not found",
    );
  });
});
