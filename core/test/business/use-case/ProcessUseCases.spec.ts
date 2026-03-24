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
  it("GetProcessByIdUC delega a repo.getById", () => {
    const entity = new Process(2, "proc-2", []);
    const repo: Pick<IProcessRepository, "getById"> = {
      getById: vi.fn().mockReturnValue(entity),
    };

    const uc = new GetProcessByIdUC(repo as IProcessRepository);
    const result = uc.execute(12);

    expect(repo.getById).toHaveBeenCalledWith(12);
    expect(result).toBe(entity);
  });

  it("GetProcessByDocumentClassUC delega a repo.getByDocumentClassId", () => {
    const list = [new Process(3, "proc-3", [])];
    const repo: Pick<IProcessRepository, "getByDocumentClassId"> = {
      getByDocumentClassId: vi.fn().mockReturnValue(list),
    };

    const uc = new GetProcessByDocumentClassUC(repo as IProcessRepository);
    const result = uc.execute(3);

    expect(repo.getByDocumentClassId).toHaveBeenCalledWith(3);
    expect(result).toBe(list);
  });

  it("GetProcessByStatusUC delega a repo.getByStatus", () => {
    const list = [new Process(4, "proc-4", [])];
    const repo: Pick<IProcessRepository, "getByStatus"> = {
      getByStatus: vi.fn().mockReturnValue(list),
    };

    const uc = new GetProcessByStatusUC(repo as IProcessRepository);
    const result = uc.execute(IntegrityStatusEnum.VALID);

    expect(repo.getByStatus).toHaveBeenCalledWith(IntegrityStatusEnum.VALID);
    expect(result).toBe(list);
  });

  it("CheckProcessIntegrityStatusUC aggiorna lo status aggregato dai document", () => {
    const processRepo: Pick<
      IProcessRepository,
      "getById" | "updateIntegrityStatus"
    > = {
      getById: vi.fn().mockReturnValue(new Process(1, "proc-1", [])),
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

  it("CheckProcessIntegrityStatusUC lancia errore se processo inesistente", () => {
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
