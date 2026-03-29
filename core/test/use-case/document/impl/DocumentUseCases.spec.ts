import { describe, expect, it, vi } from "vitest";

import { GetDocumentByIdUC } from "../../../../src/use-case/document/impl/GetDocumentByIdUC";
import { GetDocumentByProcessUC } from "../../../../src/use-case/document/impl/GetDocumentByProcessUC";
import { GetDocumentByStatusUC } from "../../../../src/use-case/document/impl/GetDocumentByStatusUC";
import { CheckDocumentIntegrityStatusUC } from "../../../../src/use-case/document/impl/CheckDocumentIntegrityStatusUC";
import { Document } from "../../../../src/entity/Document";
import { IDocumentRepository } from "../../../../src/repo/IDocumentRepository";
import { IntegrityStatusEnum } from "../../../../src/value-objects/IntegrityStatusEnum";
import { IFileRepository } from "../../../../src/repo/IFileRepository";

describe("Document use-cases", () => {
  // identifier: TU-S-browsing-91
  // method_name: execute()
  // description: should GetDocumentByIdUC delega a repo.getById
  // expected_value: matches asserted behavior: GetDocumentByIdUC delega a repo.getById
  it("TU-S-browsing-91: execute() should GetDocumentByIdUC delega a repo.getById", () => {
    const entity = new Document("doc-2", [], "process-uuid");
    const repo: Pick<IDocumentRepository, "getById"> = {
      getById: vi.fn().mockReturnValue(entity),
    };

    const uc = new GetDocumentByIdUC(repo as IDocumentRepository);
    const result = uc.execute(10);

    expect(repo.getById).toHaveBeenCalledWith(10);
    expect(result).toBe(entity);
  });

  // identifier: TU-S-browsing-92
  // method_name: execute()
  // description: should GetDocumentByProcessUC delega a repo.getByProcessId
  // expected_value: matches asserted behavior: GetDocumentByProcessUC delega a repo.getByProcessId
  it("TU-S-browsing-92: execute() should GetDocumentByProcessUC delega a repo.getByProcessId", () => {
    const list = [new Document("doc-3", [], "process-uuid")];
    const repo: Pick<IDocumentRepository, "getByProcessId"> = {
      getByProcessId: vi.fn().mockReturnValue(list),
    };

    const uc = new GetDocumentByProcessUC(repo as IDocumentRepository);
    const result = uc.execute(3);

    expect(repo.getByProcessId).toHaveBeenCalledWith(3);
    expect(result).toBe(list);
  });

  // identifier: TU-S-browsing-93
  // method_name: execute()
  // description: should GetDocumentByStatusUC delega a repo.getByStatus
  // expected_value: matches asserted behavior: GetDocumentByStatusUC delega a repo.getByStatus
  it("TU-S-browsing-93: execute() should GetDocumentByStatusUC delega a repo.getByStatus", () => {
    const list = [new Document("doc-4", [], "process-uuid")];
    const repo: Pick<IDocumentRepository, "getByStatus"> = {
      getByStatus: vi.fn().mockReturnValue(list),
    };

    const uc = new GetDocumentByStatusUC(repo as IDocumentRepository);
    const result = uc.execute(IntegrityStatusEnum.VALID);

    expect(repo.getByStatus).toHaveBeenCalledWith(IntegrityStatusEnum.VALID);
    expect(result).toBe(list);
  });

  // identifier: TU-S-browsing-94
  // method_name: execute()
  // description: should CheckDocumentIntegrityStatusUC aggiorna lo status aggregato dai file
  // expected_value: matches asserted behavior: CheckDocumentIntegrityStatusUC aggiorna lo status aggregato dai file
  it("TU-S-browsing-94: execute() should CheckDocumentIntegrityStatusUC aggiorna lo status aggregato dai file", () => {
    const docRepo: Pick<
      IDocumentRepository,
      "getById" | "updateIntegrityStatus"
    > = {
      getById: vi
        .fn()
        .mockReturnValue(new Document("doc-1", [], "process-uuid")),
      updateIntegrityStatus: vi.fn(),
    };
    const fileRepo: Pick<
      IFileRepository,
      "getAggregatedIntegrityStatusByDocumentId"
    > = {
      getAggregatedIntegrityStatusByDocumentId: vi
        .fn()
        .mockReturnValue(IntegrityStatusEnum.INVALID),
    };

    const uc = new CheckDocumentIntegrityStatusUC(
      docRepo as IDocumentRepository,
      fileRepo as IFileRepository,
    );
    const result = uc.execute(1);

    expect(
      fileRepo.getAggregatedIntegrityStatusByDocumentId,
    ).toHaveBeenCalledWith(1);
    expect(docRepo.updateIntegrityStatus).toHaveBeenCalledWith(
      1,
      IntegrityStatusEnum.INVALID,
    );
    expect(result).toBe(IntegrityStatusEnum.INVALID);
  });

  // identifier: TU-S-browsing-95
  // method_name: execute()
  // description: should CheckDocumentIntegrityStatusUC lancia errore se document inesistente
  // expected_value: matches asserted behavior: CheckDocumentIntegrityStatusUC lancia errore se document inesistente
  it("TU-S-browsing-95: execute() should CheckDocumentIntegrityStatusUC lancia errore se document inesistente", () => {
    const docRepo: Pick<
      IDocumentRepository,
      "getById" | "updateIntegrityStatus"
    > = {
      getById: vi.fn().mockReturnValue(null),
      updateIntegrityStatus: vi.fn(),
    };
    const fileRepo: Pick<
      IFileRepository,
      "getAggregatedIntegrityStatusByDocumentId"
    > = {
      getAggregatedIntegrityStatusByDocumentId: vi.fn(),
    };

    const uc = new CheckDocumentIntegrityStatusUC(
      docRepo as IDocumentRepository,
      fileRepo as IFileRepository,
    );

    expect(() => uc.execute(77)).toThrow("Document with id 77 not found");
  });
});
