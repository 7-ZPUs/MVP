import fs from "node:fs";
import { describe, expect, it, vi } from "vitest";

import { CreateFileUC } from "../../../src/use-case/file/impl/CreateFileUC";
import { GetFileByIdUC } from "../../../src/use-case/file/impl/GetFileByIdUC";
import { GetFileByDocumentUC } from "../../../src/use-case/file/impl/GetFileByDocumentUC";
import { GetFileByStatusUC } from "../../../src/use-case/file/impl/GetFileByStatusUC";
import { CheckFileIntegrityStatusUC } from "../../../src/use-case/file/impl/CheckFileIntegrityStatusUC";
import { File } from "../../../src/entity/File";
import { IFileRepository } from "../../../src/repo/IFileRepository";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";
import { IHashingService } from "../../../src/services/IHashingService";

describe("File use-cases", () => {
    it("CreateFileUC delega a repo.save", () => {
        const entity = new File("file.xml", "/file.xml", "hash-1", true, 1);
        const repo: Pick<IFileRepository, "save"> = { save: vi.fn().mockReturnValue(entity) };

        const uc = new CreateFileUC(repo as IFileRepository);
        const input = { documentId: 1, filename: "file.xml", path: "/file.xml", isMain: true, hash: "hash-1" };
        const result = uc.execute(input);

        const savedEntity = (repo.save as ReturnType<typeof vi.fn>).mock.calls[0][0] as File;

        expect(repo.save).toHaveBeenCalledTimes(1);
        expect(savedEntity).toBeInstanceOf(File);
        expect(savedEntity.getFilename()).toBe(input.filename);
        expect(savedEntity.getPath()).toBe(input.path);
        expect(savedEntity.getHash()).toBe(input.hash);
        expect(savedEntity.getIsMain()).toBe(input.isMain);
        expect(savedEntity.getDocumentId()).toBe(input.documentId);
        expect(result).toBe(entity);
    });

    it("GetFileByIdUC delega a repo.getById", () => {
        const entity = new File("f", "/f", "h", false, 2);
        const repo: Pick<IFileRepository, "getById"> = { getById: vi.fn().mockReturnValue(entity) };

        const uc = new GetFileByIdUC(repo as IFileRepository);
        const result = uc.execute(11);

        expect(repo.getById).toHaveBeenCalledWith(11);
        expect(result).toBe(entity);
    });

    it("GetFileByDocumentUC delega a repo.getByDocumentId", () => {
        const list = [new File("f", "/f", "h", false, 8)];
        const repo: Pick<IFileRepository, "getByDocumentId"> = { getByDocumentId: vi.fn().mockReturnValue(list) };

        const uc = new GetFileByDocumentUC(repo as IFileRepository);
        const result = uc.execute(8);

        expect(repo.getByDocumentId).toHaveBeenCalledWith(8);
        expect(result).toBe(list);
    });

    it("GetFileByStatusUC delega a repo.getByStatus", () => {
        const list = [new File("f", "/f", "h", false, 8)];
        const repo: Pick<IFileRepository, "getByStatus"> = { getByStatus: vi.fn().mockReturnValue(list) };

        const uc = new GetFileByStatusUC(repo as IFileRepository);
        const result = uc.execute(IntegrityStatusEnum.UNKNOWN);

        expect(repo.getByStatus).toHaveBeenCalledWith(IntegrityStatusEnum.UNKNOWN);
        expect(result).toBe(list);
    });

    it("CheckFileIntegrityStatusUC imposta VALID se hash coincide", async () => {
        const entity = new File("f", "/f", "expected", false, 8);
        const repo: Pick<IFileRepository, "getById" | "updateIntegrityStatus"> = {
            getById: vi.fn().mockReturnValue(entity),
            updateIntegrityStatus: vi.fn(),
        };
        const hashingService: Pick<IHashingService, "calcolaHash"> = {
            calcolaHash: vi.fn().mockResolvedValue("expected"),
        };

        vi.spyOn(fs, "readFileSync").mockReturnValue(Buffer.from("abc"));

        const uc = new CheckFileIntegrityStatusUC(repo as IFileRepository, hashingService as IHashingService);
        const result = await uc.execute(8);

        expect(result).toBe(IntegrityStatusEnum.VALID);
        expect(repo.updateIntegrityStatus).toHaveBeenCalledWith(8, IntegrityStatusEnum.VALID);
    });

    it("CheckFileIntegrityStatusUC imposta UNKNOWN se hash atteso manca", async () => {
        const entity = new File("f", "/f", "", false, 8);
        const repo: Pick<IFileRepository, "getById" | "updateIntegrityStatus"> = {
            getById: vi.fn().mockReturnValue(entity),
            updateIntegrityStatus: vi.fn(),
        };
        const hashingService: Pick<IHashingService, "calcolaHash"> = {
            calcolaHash: vi.fn(),
        };

        const uc = new CheckFileIntegrityStatusUC(repo as IFileRepository, hashingService as IHashingService);
        const result = await uc.execute(8);

        expect(result).toBe(IntegrityStatusEnum.UNKNOWN);
        expect(repo.updateIntegrityStatus).toHaveBeenCalledWith(8, IntegrityStatusEnum.UNKNOWN);
        expect(hashingService.calcolaHash).not.toHaveBeenCalled();
    });

    it("CheckFileIntegrityStatusUC lancia errore se file inesistente", async () => {
        const repo: Pick<IFileRepository, "getById" | "updateIntegrityStatus"> = {
            getById: vi.fn().mockReturnValue(null),
            updateIntegrityStatus: vi.fn(),
        };
        const hashingService: Pick<IHashingService, "calcolaHash"> = {
            calcolaHash: vi.fn(),
        };

        const uc = new CheckFileIntegrityStatusUC(repo as IFileRepository, hashingService as IHashingService);

        await expect(uc.execute(99)).rejects.toThrow("File with id 99 not found");
    });
});
