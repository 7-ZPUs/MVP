import { describe, expect, it, vi } from "vitest";

import { GetDocumentClassByIdUC } from "../../../src/use-case/classe-documentale/impl/GetDocumentClassByIdUC";
import { GetDocumentClassByDipIdUC } from "../../../src/use-case/classe-documentale/impl/GetDocumentClassByDipUC";
import { GetDocumentClassByStatusUC } from "../../../src/use-case/classe-documentale/impl/GetDocumentClassByStatusUC";
import { CheckDocumentClassIntegrityStatusUC } from "../../../src/use-case/classe-documentale/impl/CheckDocumentClassIntegrityStatusUC";
import { DocumentClass } from "../../../src/entity/DocumentClass";
import { IDocumentClassRepository } from "../../../src/repo/IDocumentClassRepository";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";
import { IProcessRepository } from "../../../src/repo/IProcessRepository";

describe("DocumentClass use-cases", () => {
  it("GetDocumentClassByIdUC delega a repo.getById", () => {
    const entity = new DocumentClass(1, "dc-1", "Classe", "2026-01-01");
    const repo: Pick<IDocumentClassRepository, "getById"> = {
      getById: vi.fn().mockReturnValue(entity),
    };

    const uc = new GetDocumentClassByIdUC(repo as IDocumentClassRepository);
    const result = uc.execute(5);

    expect(repo.getById).toHaveBeenCalledWith(5);
    expect(result).toBe(entity);
  });

  it("GetDocumentClassByDipIdUC delega a repo.getByDipId", () => {
    const list = [new DocumentClass(9, "dc-2", "Classe", "2026-01-01")];
    const repo: Pick<IDocumentClassRepository, "getByDipId"> = {
      getByDipId: vi.fn().mockReturnValue(list),
    };

    const uc = new GetDocumentClassByDipIdUC(repo as IDocumentClassRepository);
    const result = uc.execute(9);

    expect(repo.getByDipId).toHaveBeenCalledWith(9);
    expect(result).toBe(list);
  });

  it("GetDocumentClassByStatusUC delega a repo.getByStatus", () => {
    const list = [new DocumentClass(1, "dc-3", "Classe", "2026-01-01")];
    const repo: Pick<IDocumentClassRepository, "getByStatus"> = {
      getByStatus: vi.fn().mockReturnValue(list),
    };

    const uc = new GetDocumentClassByStatusUC(repo as IDocumentClassRepository);
    const result = uc.execute(IntegrityStatusEnum.INVALID);

    expect(repo.getByStatus).toHaveBeenCalledWith(IntegrityStatusEnum.INVALID);
    expect(result).toBe(list);
  });

  it("CheckDocumentClassIntegrityStatusUC aggiorna lo status aggregato dai process", () => {
    const docClassRepo: Pick<
      IDocumentClassRepository,
      "getById" | "updateIntegrityStatus"
    > = {
      getById: vi
        .fn()
        .mockReturnValue(new DocumentClass(1, "dc", "Classe", "2026-01-01")),
      updateIntegrityStatus: vi.fn(),
    };
    const processRepo: Pick<
      IProcessRepository,
      "getAggregatedIntegrityStatusByDocumentClassId"
    > = {
      getAggregatedIntegrityStatusByDocumentClassId: vi
        .fn()
        .mockReturnValue(IntegrityStatusEnum.UNKNOWN),
    };

    const uc = new CheckDocumentClassIntegrityStatusUC(
      docClassRepo as IDocumentClassRepository,
      processRepo as IProcessRepository,
    );
    const result = uc.execute(1);

    expect(
      processRepo.getAggregatedIntegrityStatusByDocumentClassId,
    ).toHaveBeenCalledWith(1);
    expect(docClassRepo.updateIntegrityStatus).toHaveBeenCalledWith(
      1,
      IntegrityStatusEnum.UNKNOWN,
    );
    expect(result).toBe(IntegrityStatusEnum.UNKNOWN);
  });

  it("CheckDocumentClassIntegrityStatusUC lancia errore se classe inesistente", () => {
    const docClassRepo: Pick<
      IDocumentClassRepository,
      "getById" | "updateIntegrityStatus"
    > = {
      getById: vi.fn().mockReturnValue(null),
      updateIntegrityStatus: vi.fn(),
    };
    const processRepo: Pick<
      IProcessRepository,
      "getAggregatedIntegrityStatusByDocumentClassId"
    > = {
      getAggregatedIntegrityStatusByDocumentClassId: vi.fn(),
    };

    const uc = new CheckDocumentClassIntegrityStatusUC(
      docClassRepo as IDocumentClassRepository,
      processRepo as IProcessRepository,
    );

    expect(() => uc.execute(14)).toThrow("DocumentClass with id 14 not found");
  });
});
