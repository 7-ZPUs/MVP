import { describe, expect, it, vi } from "vitest";

import { GetDocumentClassByIdUC } from "../../../../src/use-case/classe-documentale/impl/GetDocumentClassByIdUC";
import { GetDocumentClassByDipIdUC } from "../../../../src/use-case/classe-documentale/impl/GetDocumentClassByDipUC";
import { GetDocumentClassByStatusUC } from "../../../../src/use-case/classe-documentale/impl/GetDocumentClassByStatusUC";
import { CheckDocumentClassIntegrityStatusUC } from "../../../../src/use-case/classe-documentale/impl/CheckDocumentClassIntegrityStatusUC";
import { DocumentClass } from "../../../../src/entity/DocumentClass";
import {
  IGetDocumentClassByDipIdPort,
  IGetDocumentClassByIdPort,
  IGetDocumentClassByStatusPort,
} from "../../../../src/repo/IDocumentClassRepository";
import { IntegrityStatusEnum } from "../../../../src/value-objects/IntegrityStatusEnum";
import { IIntegrityVerificationService } from "../../../../src/services/IIntegrityVerificationService";

describe("DocumentClass use-cases", () => {
  // identifier: TU-S-browsing-80
  // method_name: execute()
  // description: should GetDocumentClassByIdUC delega a repo.getById
  // expected_value: matches asserted behavior: GetDocumentClassByIdUC delega a repo.getById
  it("TU-S-browsing-80: execute() should GetDocumentClassByIdUC delega a repo.getById", () => {
    const entity = new DocumentClass("1", "dc-1", "Classe", "2026-01-01");
    const repo: IGetDocumentClassByIdPort = {
      getById: vi.fn().mockReturnValue(entity),
    };

    const uc = new GetDocumentClassByIdUC(repo);
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
    const repo: IGetDocumentClassByDipIdPort = {
      getByDipId: vi.fn().mockReturnValue(list),
    };

    const uc = new GetDocumentClassByDipIdUC(repo);
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
    const repo: IGetDocumentClassByStatusPort = {
      getByStatus: vi.fn().mockReturnValue(list),
    };

    const uc = new GetDocumentClassByStatusUC(repo);
    const result = uc.execute(IntegrityStatusEnum.INVALID);

    expect(repo.getByStatus).toHaveBeenCalledWith(IntegrityStatusEnum.INVALID);
    expect(result).toBe(list);
  });

  // identifier: TU-S-browsing-83
  // method_name: execute()
  // description: should CheckDocumentClassIntegrityStatusUC delega al servizio di verifica integrità
  // expected_value: matches asserted behavior: CheckDocumentClassIntegrityStatusUC delega al servizio di verifica integrità
  it("TU-S-browsing-83: execute() should CheckDocumentClassIntegrityStatusUC aggiorna lo status aggregato dai process", async () => {
    const integrityService: Pick<
      IIntegrityVerificationService,
      "checkDocumentClassIntegrityStatus"
    > = {
      checkDocumentClassIntegrityStatus: vi
        .fn()
        .mockResolvedValue(IntegrityStatusEnum.UNKNOWN),
    };

    const uc = new CheckDocumentClassIntegrityStatusUC(
      integrityService as IIntegrityVerificationService,
    );
    const result = await uc.execute(1);

    expect(
      integrityService.checkDocumentClassIntegrityStatus,
    ).toHaveBeenCalledWith(1);
    expect(result).toBe(IntegrityStatusEnum.UNKNOWN);
  });

  // identifier: TU-S-browsing-84
  // method_name: execute()
  // description: should CheckDocumentClassIntegrityStatusUC propaga errore dal servizio
  // expected_value: matches asserted behavior: CheckDocumentClassIntegrityStatusUC propaga errore dal servizio
  it("TU-S-browsing-84: execute() should CheckDocumentClassIntegrityStatusUC lancia errore se classe inesistente", async () => {
    const integrityService: Pick<
      IIntegrityVerificationService,
      "checkDocumentClassIntegrityStatus"
    > = {
      checkDocumentClassIntegrityStatus: vi
        .fn()
        .mockRejectedValue(new Error("DocumentClass with id 14 not found")),
    };

    const uc = new CheckDocumentClassIntegrityStatusUC(
      integrityService as IIntegrityVerificationService,
    );

    await expect(uc.execute(14)).rejects.toThrow(
      "DocumentClass with id 14 not found",
    );
  });
});
