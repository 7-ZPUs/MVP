import { describe, expect, it, vi } from "vitest";

import { GetDocumentClassByIdUC } from "../../../../src/use-case/classe-documentale/impl/GetDocumentClassByIdUC";
import { GetDocumentClassByDipIdUC } from "../../../../src/use-case/classe-documentale/impl/GetDocumentClassByDipUC";
import { GetDocumentClassByStatusUC } from "../../../../src/use-case/classe-documentale/impl/GetDocumentClassByStatusUC";
import { CheckDocumentClassIntegrityStatusUC } from "../../../../src/use-case/classe-documentale/impl/CheckDocumentClassIntegrityStatusUC";
import { DocumentClass } from "../../../../src/entity/DocumentClass";
import { IDocumentClassRepository } from "../../../../src/repo/IDocumentClassRepository";
import { IntegrityStatusEnum } from "../../../../src/value-objects/IntegrityStatusEnum";
import { IProcessRepository } from "../../../../src/repo/IProcessRepository";
import { IHashingService } from "../../../../src/services/IHashingService";

describe("DocumentClass use-cases", () => {
  // identifier: TU-S-browsing-80
  // method_name: execute()
  // description: should GetDocumentClassByIdUC delega a repo.getById
  // expected_value: matches asserted behavior: GetDocumentClassByIdUC delega a repo.getById
  it("TU-S-browsing-80: execute() should GetDocumentClassByIdUC delega a repo.getById", () => {
    const entity = new DocumentClass("1", "dc-1", "Classe", "2026-01-01");
    const repo: Pick<IDocumentClassRepository, "getById"> = {
      getById: vi.fn().mockReturnValue(entity),
    };

    const uc = new GetDocumentClassByIdUC(repo as IDocumentClassRepository);
    const result = uc.execute(5);

    expect(repo.getById).toHaveBeenCalledWith(5);
    expect(result).toBe(entity);
  });

  // identifier: TU-S-browsing-81
  // method_name: execute()
  // description: should GetDocumentClassByDipIdUC delega a repo.getByDipId
  // expected_value: matches asserted behavior: GetDocumentClassByDipIdUC delega a repo.getByDipId
  it("TU-S-browsing-81: execute() should GetDocumentClassByDipIdUC delega a repo.getByDipId", () => {
    const list = [new DocumentClass("9", "dc-2", "Classe", "2026-01-01")];
    const repo: Pick<IDocumentClassRepository, "getByDipId"> = {
      getByDipId: vi.fn().mockReturnValue(list),
    };

    const uc = new GetDocumentClassByDipIdUC(repo as IDocumentClassRepository);
    const result = uc.execute(9);

    expect(repo.getByDipId).toHaveBeenCalledWith(9);
    expect(result).toBe(list);
  });

  // identifier: TU-S-browsing-82
  // method_name: execute()
  // description: should GetDocumentClassByStatusUC delega a repo.getByStatus
  // expected_value: matches asserted behavior: GetDocumentClassByStatusUC delega a repo.getByStatus
  it("TU-S-browsing-82: execute() should GetDocumentClassByStatusUC delega a repo.getByStatus", () => {
    const list = [new DocumentClass("1", "dc-3", "Classe", "2026-01-01")];
    const repo: Pick<IDocumentClassRepository, "getByStatus"> = {
      getByStatus: vi.fn().mockReturnValue(list),
    };

    const uc = new GetDocumentClassByStatusUC(repo as IDocumentClassRepository);
    const result = uc.execute(IntegrityStatusEnum.INVALID);

    expect(repo.getByStatus).toHaveBeenCalledWith(IntegrityStatusEnum.INVALID);
    expect(result).toBe(list);
  });

  // identifier: TU-S-browsing-83
  // method_name: execute()
  // description: should CheckDocumentClassIntegrityStatusUC aggiorna lo status aggregato dai process
  // expected_value: matches asserted behavior: CheckDocumentClassIntegrityStatusUC aggiorna lo status aggregato dai process
  it("TU-S-browsing-83: execute() should CheckDocumentClassIntegrityStatusUC aggiorna lo status aggregato dai process", () => {
    const docClassRepo: Pick<
      IDocumentClassRepository,
      "getById" | "updateIntegrityStatus"
    > = {
      getById: vi
        .fn()
        .mockReturnValue(
          new DocumentClass(
            "1",
            "dc",
            "Classe",
            "2026-01-01",
            IntegrityStatusEnum.UNKNOWN,
            1,
            2,
          ),
        ),
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

    const hashingService: Pick<IHashingService, "checkDocumentClassIntegrity"> = {
      checkDocumentClassIntegrity: vi.fn(),
    };

    const uc = new CheckDocumentClassIntegrityStatusUC(
      docClassRepo as IDocumentClassRepository,
      processRepo as IProcessRepository,
      hashingService as IHashingService,
    );
    const result = uc.execute(1);

    expect(docClassRepo.updateIntegrityStatus).toHaveBeenCalledWith(
      1,
      IntegrityStatusEnum.UNKNOWN,
    );
    expect(result).toBe(IntegrityStatusEnum.UNKNOWN);
  });

  // identifier: TU-S-browsing-84
  // method_name: execute()
  // description: should CheckDocumentClassIntegrityStatusUC lancia errore se classe inesistente
  // expected_value: matches asserted behavior: CheckDocumentClassIntegrityStatusUC lancia errore se classe inesistente
  it("TU-S-browsing-84: execute() should CheckDocumentClassIntegrityStatusUC lancia errore se classe inesistente", () => {
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

    const hashingService: Pick<IHashingService, "checkDocumentClassIntegrity"> = {
      checkDocumentClassIntegrity: vi.fn(),
    };

    const uc = new CheckDocumentClassIntegrityStatusUC(
      docClassRepo as IDocumentClassRepository,
      processRepo as IProcessRepository,
      hashingService as IHashingService,
    );

    expect(() => uc.execute(14)).toThrow("DocumentClass with id 14 not found");
  });
});
