import { describe, expect, it, vi } from "vitest";

import { CreateProcessUC } from "../../../src/use-case/process/impl/CreateProcessUC";
import { GetProcessByIdUC } from "../../../src/use-case/process/impl/GetProcessByIdUC";
import { GetProcessByDocumentClassUC } from "../../../src/use-case/process/impl/GetProcessByDocumentClassUC";
import { GetProcessByStatusUC } from "../../../src/use-case/process/impl/GetProcessByStatus";
import { Process } from "../../../src/entity/Process";
import { IProcessRepository } from "../../../src/repo/IProcessRepository";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";

describe("Process use-cases", () => {
    it("CreateProcessUC delega a repo.save", () => {
        const entity = new Process(1, "proc-1", []);
        const repo: Pick<IProcessRepository, "save"> = { save: vi.fn().mockReturnValue(entity) };

        const uc = new CreateProcessUC(repo as IProcessRepository);
        const dto = { documentClassId: 1, uuid: "proc-1", metadata: [] };
        const result = uc.execute(dto);

        expect(repo.save).toHaveBeenCalledWith(dto);
        expect(result).toBe(entity);
    });

    it("GetProcessByIdUC delega a repo.getById", () => {
        const entity = new Process(2, "proc-2", []);
        const repo: Pick<IProcessRepository, "getById"> = { getById: vi.fn().mockReturnValue(entity) };

        const uc = new GetProcessByIdUC(repo as IProcessRepository);
        const result = uc.execute(12);

        expect(repo.getById).toHaveBeenCalledWith(12);
        expect(result).toBe(entity);
    });

    it("GetProcessByDocumentClassUC delega a repo.getByDocumentClassId", () => {
        const list = [new Process(3, "proc-3", [])];
        const repo: Pick<IProcessRepository, "getByDocumentClassId"> = { getByDocumentClassId: vi.fn().mockReturnValue(list) };

        const uc = new GetProcessByDocumentClassUC(repo as IProcessRepository);
        const result = uc.execute(3);

        expect(repo.getByDocumentClassId).toHaveBeenCalledWith(3);
        expect(result).toBe(list);
    });

    it("GetProcessByStatusUC delega a repo.getByStatus", () => {
        const list = [new Process(4, "proc-4", [])];
        const repo: Pick<IProcessRepository, "getByStatus"> = { getByStatus: vi.fn().mockReturnValue(list) };

        const uc = new GetProcessByStatusUC(repo as IProcessRepository);
        const result = uc.execute(IntegrityStatusEnum.VALID);

        expect(repo.getByStatus).toHaveBeenCalledWith(IntegrityStatusEnum.VALID);
        expect(result).toBe(list);
    });
});
