import { describe, expect, it, vi } from "vitest";

import { CreateDocumentUC } from "../../../src/use-case/document/impl/CreateDocumentUC";
import { GetDocumentByIdUC } from "../../../src/use-case/document/impl/GetDocumentByIdUC";
import { GetDocumentByProcessUC } from "../../../src/use-case/document/impl/GetDocumentByProcessUC";
import { GetDocumentByStatusUC } from "../../../src/use-case/document/impl/GetDocumentByStatusUC";
import { Document } from "../../../src/entity/Document";
import { IDocumentRepository } from "../../../src/repo/IDocumentRepository";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";

describe("Document use-cases", () => {
    it("CreateDocumentUC delega a repo.save", () => {
        const entity = new Document("doc-1", [], 1);
        const repo: Pick<IDocumentRepository, "save"> = { save: vi.fn().mockReturnValue(entity) };

        const uc = new CreateDocumentUC(repo as IDocumentRepository);
        const dto = { processId: 1, uuid: "doc-1", metadata: [] };
        const result = uc.execute(dto);

        expect(repo.save).toHaveBeenCalledWith(dto);
        expect(result).toBe(entity);
    });

    it("GetDocumentByIdUC delega a repo.getById", () => {
        const entity = new Document("doc-2", [], 2);
        const repo: Pick<IDocumentRepository, "getById"> = { getById: vi.fn().mockReturnValue(entity) };

        const uc = new GetDocumentByIdUC(repo as IDocumentRepository);
        const result = uc.execute(10);

        expect(repo.getById).toHaveBeenCalledWith(10);
        expect(result).toBe(entity);
    });

    it("GetDocumentByProcessUC delega a repo.getByProcessId", () => {
        const list = [new Document("doc-3", [], 3)];
        const repo: Pick<IDocumentRepository, "getByProcessId"> = { getByProcessId: vi.fn().mockReturnValue(list) };

        const uc = new GetDocumentByProcessUC(repo as IDocumentRepository);
        const result = uc.execute(3);

        expect(repo.getByProcessId).toHaveBeenCalledWith(3);
        expect(result).toBe(list);
    });

    it("GetDocumentByStatusUC delega a repo.getByStatus", () => {
        const list = [new Document("doc-4", [], 4)];
        const repo: Pick<IDocumentRepository, "getByStatus"> = { getByStatus: vi.fn().mockReturnValue(list) };

        const uc = new GetDocumentByStatusUC(repo as IDocumentRepository);
        const result = uc.execute(IntegrityStatusEnum.VALID);

        expect(repo.getByStatus).toHaveBeenCalledWith(IntegrityStatusEnum.VALID);
        expect(result).toBe(list);
    });
});
