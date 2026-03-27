import { describe, expect, it, vi } from "vitest";

import { GetProcessByIdUC } from "../../../src/use-case/process/impl/GetProcessByIdUC";
import { GetProcessByDocumentClassUC } from "../../../src/use-case/process/impl/GetProcessByDocumentClassUC";
import { GetProcessByStatusUC } from "../../../src/use-case/process/impl/GetProcessByStatus";
import { CheckProcessIntegrityStatusUC } from "../../../src/use-case/process/impl/CheckProcessIntegrityStatusUC";
import { Process } from "../../../src/entity/Process";
import { IProcessRepository } from "../../../src/repo/IProcessRepository";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";
import { IDocumentRepository } from "../../../src/repo/IDocumentRepository";

describe("Process use-cases", () => {
  // identifier: TU-F-B-22
  // method_name: GetProcessByIdUC.execute()
  // description: should return the correct process
  // expected_value: returns the correct process
  it("TU-F-B-22: GetProcessByIdUC.execute() with valid process id should return the correct process", () => {
    const entity = new Process("dc-uuid", "proc-2", []);
    const repo: Pick<IProcessRepository, "getById"> = {
      getById: vi.fn().mockReturnValue(entity),
    };

    const uc = new GetProcessByIdUC(repo as IProcessRepository);
    const result = uc.execute(12);

    expect(repo.getById).toHaveBeenCalledWith(12);
    expect(result).toBe(entity);
  });

  // identifier: TU-F-B-23
  // method_name: GetProcessByDocumentClassUC.execute()
  // description: should return list of processes
  // expected_value: returns list of processes
  it("TU-F-B-23: GetProcessByDocumentClassUC.execute() with valid document class id should return list of processes", () => {
    const list = [new Process("dc-uuid", "proc-3", [])];
    const repo: Pick<IProcessRepository, "getByDocumentClassId"> = {
      getByDocumentClassId: vi.fn().mockReturnValue(list),
    };

    const uc = new GetProcessByDocumentClassUC(repo as IProcessRepository);
    const result = uc.execute(3);

    expect(repo.getByDocumentClassId).toHaveBeenCalledWith(3);
    expect(result).toBe(list);
  });

  // identifier: TU-F-B-24
  // method_name: GetProcessByStatusUC.execute()
  // description: should return list of processes
  // expected_value: returns list of processes
  it("TU-F-B-24: GetProcessByStatusUC.execute() with matching status should return list of processes", () => {
    const list = [new Process("dc-uuid", "proc-4", [])];
    const repo: Pick<IProcessRepository, "getByStatus"> = {
      getByStatus: vi.fn().mockReturnValue(list),
    };

    const uc = new GetProcessByStatusUC(repo as IProcessRepository);
    const result = uc.execute(IntegrityStatusEnum.VALID);

    expect(repo.getByStatus).toHaveBeenCalledWith(IntegrityStatusEnum.VALID);
    expect(result).toBe(list);
  });

  // identifier: TU-F-B-25
  // method_name: CheckProcessIntegrityStatusUC.execute()
  // description: should update and return aggregated status
  // expected_value: updates state as asserted: update and return aggregated status
  it("TU-F-B-25: CheckProcessIntegrityStatusUC.execute() with valid process id should update and return aggregated status", () => {
    const processRepo: Pick<
      IProcessRepository,
      "getById" | "updateIntegrityStatus"
    > = {
      getById: vi.fn().mockReturnValue(new Process("dc-uuid", "proc-1", [])),
      updateIntegrityStatus: vi.fn(),
    };
    const docRepo: Pick<
      IDocumentRepository,
      "getAggregatedIntegrityStatusByProcessId"
    > = {
      getAggregatedIntegrityStatusByProcessId: vi
        .fn()
        .mockReturnValue(IntegrityStatusEnum.VALID),
    };

    const uc = new CheckProcessIntegrityStatusUC(
      processRepo as IProcessRepository,
      docRepo as IDocumentRepository,
    );
    const result = uc.execute(1);

    expect(
      docRepo.getAggregatedIntegrityStatusByProcessId,
    ).toHaveBeenCalledWith(1);
    expect(processRepo.updateIntegrityStatus).toHaveBeenCalledWith(
      1,
      IntegrityStatusEnum.VALID,
    );
    expect(result).toBe(IntegrityStatusEnum.VALID);
  });

  // identifier: TU-F-B-26
  // method_name: CheckProcessIntegrityStatusUC.execute()
  // description: should throw an error
  // expected_value: throws an error
  it("TU-F-B-26: CheckProcessIntegrityStatusUC.execute() with non-existent process id should throw an error", () => {
    const processRepo: Pick<
      IProcessRepository,
      "getById" | "updateIntegrityStatus"
    > = {
      getById: vi.fn().mockReturnValue(null),
      updateIntegrityStatus: vi.fn(),
    };
    const docRepo: Pick<
      IDocumentRepository,
      "getAggregatedIntegrityStatusByProcessId"
    > = {
      getAggregatedIntegrityStatusByProcessId: vi.fn(),
    };

    const uc = new CheckProcessIntegrityStatusUC(
      processRepo as IProcessRepository,
      docRepo as IDocumentRepository,
    );

    expect(() => uc.execute(55)).toThrow("Process with id 55 not found");
  });
});
