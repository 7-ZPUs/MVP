import { describe, expect, it, vi } from "vitest";

import { GetDocumentByIdUC } from "../../../../src/use-case/document/impl/GetDocumentByIdUC";
import { GetDocumentByProcessUC } from "../../../../src/use-case/document/impl/GetDocumentByProcessUC";
import { GetDocumentByStatusUC } from "../../../../src/use-case/document/impl/GetDocumentByStatusUC";
import { CheckDocumentIntegrityStatusUC } from "../../../../src/use-case/document/impl/CheckDocumentIntegrityStatusUC";
import { Document } from "../../../../src/entity/Document";
import {
  IGetDocumentByIdPort,
  IGetDocumentByProcessIdPort,
  IGetDocumentByStatusPort,
} from "../../../../src/repo/IDocumentRepository";
import { IntegrityStatusEnum } from "../../../../src/value-objects/IntegrityStatusEnum";
import { IIntegrityVerificationService } from "../../../../src/services/IIntegrityVerificationService";
import { Metadata, MetadataType } from "../../../../src/value-objects/Metadata";

describe("Document use-cases", () => {
  // identifier: TU-S-browsing-91
  // method_name: execute()
  // description: should GetDocumentByIdUC delega a repo.getById
  // expected_value: matches asserted behavior: GetDocumentByIdUC delega a repo.getById
  it("TU-S-browsing-91: execute() should GetDocumentByIdUC delega a repo.getById", () => {
    const entity = new Document("doc-2", {} as Metadata, "process-uuid");
    const repo: IGetDocumentByIdPort = {
      getById: vi.fn().mockReturnValue(entity),
    };

    const uc = new GetDocumentByIdUC(repo);
    const result = uc.execute(10);

    expect(repo.getById).toHaveBeenCalledWith(10);
    expect(result).toBe(entity);
  });

  // identifier: TU-S-browsing-92
  // method_name: execute()
  // description: should GetDocumentByProcessUC delega a repo.getByProcessId
  // expected_value: matches asserted behavior: GetDocumentByProcessUC delega a repo.getByProcessId
  it("TU-S-browsing-92: execute() should GetDocumentByProcessUC delega a repo.getByProcessId", () => {
    const list = [new Document("doc-3", {} as Metadata, "process-uuid")];
    const repo: IGetDocumentByProcessIdPort = {
      getByProcessId: vi.fn().mockReturnValue(list),
    };

    const uc = new GetDocumentByProcessUC(repo);
    const result = uc.execute(3);

    expect(repo.getByProcessId).toHaveBeenCalledWith(3);
    expect(result).toBe(list);
  });

  // identifier: TU-S-browsing-93
  // method_name: execute()
  // description: should GetDocumentByStatusUC delega a repo.getByStatus
  // expected_value: matches asserted behavior: GetDocumentByStatusUC delega a repo.getByStatus
  it("TU-S-browsing-93: execute() should GetDocumentByStatusUC delega a repo.getByStatus", () => {
    const list = [new Document("doc-4", {} as Metadata, "process-uuid")];
    const repo: IGetDocumentByStatusPort = {
      getByStatus: vi.fn().mockReturnValue(list),
    };

    const uc = new GetDocumentByStatusUC(repo);
    const result = uc.execute(IntegrityStatusEnum.VALID);

    expect(repo.getByStatus).toHaveBeenCalledWith(IntegrityStatusEnum.VALID);
    expect(result).toBe(list);
  });

  // identifier: TU-S-browsing-94
  // method_name: execute()
  // description: should CheckDocumentIntegrityStatusUC delega al servizio di verifica integrità
  // expected_value: matches asserted behavior: CheckDocumentIntegrityStatusUC delega al servizio di verifica integrità
  it("TU-S-browsing-94: execute() should CheckDocumentIntegrityStatusUC aggiorna lo status aggregato dai file", async () => {
    const integrityService: Pick<
      IIntegrityVerificationService,
      "checkDocumentIntegrityStatus"
    > = {
      checkDocumentIntegrityStatus: vi
        .fn()
        .mockResolvedValue(IntegrityStatusEnum.INVALID),
    };

    const uc = new CheckDocumentIntegrityStatusUC(
      integrityService as IIntegrityVerificationService,
    );
    const result = await uc.execute(1);

    expect(integrityService.checkDocumentIntegrityStatus).toHaveBeenCalledWith(
      1,
    );
    expect(result).toBe(IntegrityStatusEnum.INVALID);
  });

  // identifier: TU-S-browsing-95
  // method_name: execute()
  // description: should CheckDocumentIntegrityStatusUC propaga errore dal servizio
  // expected_value: matches asserted behavior: CheckDocumentIntegrityStatusUC propaga errore dal servizio
  it("TU-S-browsing-95: execute() should CheckDocumentIntegrityStatusUC lancia errore se document inesistente", async () => {
    const integrityService: Pick<
      IIntegrityVerificationService,
      "checkDocumentIntegrityStatus"
    > = {
      checkDocumentIntegrityStatus: vi
        .fn()
        .mockRejectedValue(new Error("Document with id 77 not found")),
    };

    const uc = new CheckDocumentIntegrityStatusUC(
      integrityService as IIntegrityVerificationService,
    );

    await expect(uc.execute(77)).rejects.toThrow(
      "Document with id 77 not found",
    );
  });
});
