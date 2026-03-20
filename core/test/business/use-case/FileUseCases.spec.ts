import { describe, expect, it, vi } from "vitest";

import { CreateFileUC } from "../../../src/use-case/file/impl/CreateFileUC";
import { GetFileByIdUC } from "../../../src/use-case/file/impl/GetFileByIdUC";
import { GetFileByDocumentUC } from "../../../src/use-case/file/impl/GetFileByDocumentUC";
import { GetFileByStatusUC } from "../../../src/use-case/file/impl/GetFileByStatusUC";
import { File } from "../../../src/entity/File";
import { IFileRepository } from "../../../src/repo/IFileRepository";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";

describe("File use-cases", () => {
    it("CreateFileUC delega a repo.save", () => {
        const entity = new File("file.xml", "/file.xml", true, 1);
        const repo: Pick<IFileRepository, "save"> = { save: vi.fn().mockReturnValue(entity) };

        const uc = new CreateFileUC(repo as IFileRepository);
        const dto = { documentId: 1, filename: "file.xml", path: "/file.xml", isMain: true };
        const result = uc.execute(dto);

        expect(repo.save).toHaveBeenCalledWith(dto);
        expect(result).toBe(entity);
    });

    it("GetFileByIdUC delega a repo.getById", () => {
        const entity = new File("f", "/f", false, 2);
        const repo: Pick<IFileRepository, "getById"> = { getById: vi.fn().mockReturnValue(entity) };

        const uc = new GetFileByIdUC(repo as IFileRepository);
        const result = uc.execute(11);

        expect(repo.getById).toHaveBeenCalledWith(11);
        expect(result).toBe(entity);
    });

    it("GetFileByDocumentUC delega a repo.getByDocumentId", () => {
        const list = [new File("f", "/f", false, 8)];
        const repo: Pick<IFileRepository, "getByDocumentId"> = { getByDocumentId: vi.fn().mockReturnValue(list) };

        const uc = new GetFileByDocumentUC(repo as IFileRepository);
        const result = uc.execute(8);

        expect(repo.getByDocumentId).toHaveBeenCalledWith(8);
        expect(result).toBe(list);
    });

    it("GetFileByStatusUC delega a repo.getByStatus", () => {
        const list = [new File("f", "/f", false, 8)];
        const repo: Pick<IFileRepository, "getByStatus"> = { getByStatus: vi.fn().mockReturnValue(list) };

        const uc = new GetFileByStatusUC(repo as IFileRepository);
        const result = uc.execute(IntegrityStatusEnum.UNKNOWN);

        expect(repo.getByStatus).toHaveBeenCalledWith(IntegrityStatusEnum.UNKNOWN);
        expect(result).toBe(list);
    });
});
