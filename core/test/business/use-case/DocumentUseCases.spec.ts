import { describe, expect, it, vi } from "vitest";

import { GetDocumentByIdUC } from "../../../src/use-case/document/impl/GetDocumentByIdUC";
import { GetDocumentByProcessUC } from "../../../src/use-case/document/impl/GetDocumentByProcessUC";
import { GetDocumentByStatusUC } from "../../../src/use-case/document/impl/GetDocumentByStatusUC";
import { Document } from "../../../src/entity/Document";
import { IDocumentRepository } from "../../../src/repo/IDocumentRepository";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";

describe("Document use-cases", () => {
  it("GetDocumentByIdUC delega a repo.getById", () => {
    const entity = new Document("doc-2", [], 2);
    const repo: Pick<IDocumentRepository, "getById"> = {
      getById: vi.fn().mockReturnValue(entity),
    };

    const uc = new GetDocumentByIdUC(repo as IDocumentRepository);
    const result = uc.execute(10);

    expect(repo.getById).toHaveBeenCalledWith(10);
    expect(result).toBe(entity);
  });

  it("GetDocumentByProcessUC delega a repo.getByProcessId", () => {
    const list = [new Document("doc-3", [], 3)];
    const repo: Pick<IDocumentRepository, "getByProcessId"> = {
      getByProcessId: vi.fn().mockReturnValue(list),
    };

    const uc = new GetDocumentByProcessUC(repo as IDocumentRepository);
    const result = uc.execute(3);

    expect(repo.getByProcessId).toHaveBeenCalledWith(3);
    expect(result).toBe(list);
  });

  it("GetDocumentByStatusUC delega a repo.getByStatus", () => {
    const list = [new Document("doc-4", [], 4)];
    const repo: Pick<IDocumentRepository, "getByStatus"> = {
      getByStatus: vi.fn().mockReturnValue(list),
    };

    const uc = new GetDocumentByStatusUC(repo as IDocumentRepository);
    const result = uc.execute(IntegrityStatusEnum.VALID);

    expect(repo.getByStatus).toHaveBeenCalledWith(IntegrityStatusEnum.VALID);
    expect(result).toBe(list);
  });
});
