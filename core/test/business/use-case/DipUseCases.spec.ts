import { describe, expect, it, vi } from "vitest";

import { CreateDipUC } from "../../../src/use-case/dip/impl/CreateDipUC";
import { GetDipByIdUC } from "../../../src/use-case/dip/impl/GetDipByIdUC";
import { GetDipByStatusUC } from "../../../src/use-case/dip/impl/GetDipByStatusUC";
import { Dip } from "../../../src/entity/Dip";
import { IDipRepository } from "../../../src/repo/IDipRepository";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";

describe("Dip use-cases", () => {
    it("CreateDipUC delega a repo.save", () => {
        const dip = new Dip("dip-uc");
        const repo: Pick<IDipRepository, "save"> = { save: vi.fn().mockReturnValue(dip) };

        const uc = new CreateDipUC(repo as IDipRepository);
        const dto = { dipId: 1, uuid: "dip-uc", integrityStatus: IntegrityStatusEnum.UNKNOWN };
        const result = uc.execute(dto);

        expect(repo.save).toHaveBeenCalledWith(dto);
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
});
