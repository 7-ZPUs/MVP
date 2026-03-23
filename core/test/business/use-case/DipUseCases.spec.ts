import { describe, expect, it, vi } from "vitest";

import { CreateDipUC } from "../../../src/use-case/dip/impl/CreateDipUC";
import { GetDipByIdUC } from "../../../src/use-case/dip/impl/GetDipByIdUC";
import { GetDipByStatusUC } from "../../../src/use-case/dip/impl/GetDipByStatusUC";
import { CheckDipIntegrityStatusUC } from "../../../src/use-case/dip/impl/CheckDipIntegrityStatusUC";
import { Dip } from "../../../src/entity/Dip";
import { IDipRepository } from "../../../src/repo/IDipRepository";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";
import { IDocumentClassRepository } from "../../../src/repo/IDocumentClassRepository";

describe("Dip use-cases", () => {
    it("CreateDipUC delega a repo.save", () => {
        const dip = new Dip("dip-uc");
        const repo: Pick<IDipRepository, "save"> = { save: vi.fn().mockReturnValue(dip) };

        const uc = new CreateDipUC(repo as IDipRepository);
        const input = { uuid: "dip-uc" };
        const result = uc.execute(input);

        const savedEntity = (repo.save as ReturnType<typeof vi.fn>).mock.calls[0][0] as Dip;

        expect(repo.save).toHaveBeenCalledTimes(1);
        expect(savedEntity).toBeInstanceOf(Dip);
        expect(savedEntity.getUuid()).toBe(input.uuid);
        expect(result).toBe(dip);
    });

    it("GetDipByIdUC delega a repo.getById", () => {
        const dip = new Dip("dip-id");
        const repo: Pick<IDipRepository, "getById"> = { getById: vi.fn().mockReturnValue(dip) };

        const uc = new GetDipByIdUC(repo as IDipRepository);
        const result = uc.execute(10);

        expect(repo.getById).toHaveBeenCalledWith(10);
        expect(result).toBe(dip);
    });

    it("GetDipByStatusUC delega a repo.getByStatus", () => {
        const list = [new Dip("a"), new Dip("b")];
        const repo: Pick<IDipRepository, "getByStatus"> = { getByStatus: vi.fn().mockReturnValue(list) };

        const uc = new GetDipByStatusUC(repo as IDipRepository);
        const result = uc.execute(IntegrityStatusEnum.VALID);

        expect(repo.getByStatus).toHaveBeenCalledWith(IntegrityStatusEnum.VALID);
        expect(result).toBe(list);
    });

    it("CheckDipIntegrityStatusUC aggiorna lo status aggregato dalle classi documentali", () => {
        const dipRepo: Pick<IDipRepository, "getById" | "updateIntegrityStatus"> = {
            getById: vi.fn().mockReturnValue(new Dip("dip-1")),
            updateIntegrityStatus: vi.fn(),
        };
        const docClassRepo: Pick<IDocumentClassRepository, "getAggregatedIntegrityStatusByDipId"> = {
            getAggregatedIntegrityStatusByDipId: vi.fn().mockReturnValue(IntegrityStatusEnum.VALID),
        };

        const uc = new CheckDipIntegrityStatusUC(dipRepo as IDipRepository, docClassRepo as IDocumentClassRepository);
        const result = uc.execute(1);

        expect(docClassRepo.getAggregatedIntegrityStatusByDipId).toHaveBeenCalledWith(1);
        expect(dipRepo.updateIntegrityStatus).toHaveBeenCalledWith(1, IntegrityStatusEnum.VALID);
        expect(result).toBe(IntegrityStatusEnum.VALID);
    });

    it("CheckDipIntegrityStatusUC lancia errore se dip inesistente", () => {
        const dipRepo: Pick<IDipRepository, "getById" | "updateIntegrityStatus"> = {
            getById: vi.fn().mockReturnValue(null),
            updateIntegrityStatus: vi.fn(),
        };
        const docClassRepo: Pick<IDocumentClassRepository, "getAggregatedIntegrityStatusByDipId"> = {
            getAggregatedIntegrityStatusByDipId: vi.fn(),
        };

        const uc = new CheckDipIntegrityStatusUC(dipRepo as IDipRepository, docClassRepo as IDocumentClassRepository);

        expect(() => uc.execute(3)).toThrow("Dip with id 3 not found");
    });
});
