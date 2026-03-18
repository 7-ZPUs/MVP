import { beforeEach, describe, expect, it, vi } from "vitest";

import { DipRepository } from "../../../src/repo/impl/DipRepository";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";
import { DatabaseProvider } from "../../../src/repo/impl/DatabaseProvider";

describe("DipRepository", () => {
    const makeDb = () => ({
        exec: vi.fn(),
        prepare: vi.fn(),
    });

    let db: ReturnType<typeof makeDb>;
    let repo: DipRepository;

    beforeEach(() => {
        db = makeDb();
        repo = new DipRepository({ db } as unknown as DatabaseProvider);
    });

    it("save crea un dip con status UNKNOWN", () => {
        db.prepare.mockReturnValueOnce({
            run: vi.fn().mockReturnValue({ lastInsertRowid: 11 }),
        });

        const saved = repo.save({
            dipId: 0,
            uuid: "dip-1",
            integrityStatus: IntegrityStatusEnum.VALID,
        });

        expect(saved.getId()).toBeTypeOf("number");
        expect(saved.getUuid()).toBe("dip-1");
        expect(saved.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
    });

    it("getById e getByUuid restituiscono l'entità", () => {
        db.prepare
            .mockReturnValueOnce({
                get: vi.fn().mockReturnValue({
                    id: 12,
                    uuid: "dip-2",
                    integrityStatus: IntegrityStatusEnum.UNKNOWN,
                }),
            })
            .mockReturnValueOnce({
                get: vi.fn().mockReturnValue({
                    id: 12,
                    uuid: "dip-2",
                    integrityStatus: IntegrityStatusEnum.UNKNOWN,
                }),
            });

        const byId = repo.getById(12);
        const byUuid = repo.getByUuid("dip-2");

        expect(byId?.getUuid()).toBe("dip-2");
        expect(byUuid?.getId()).toBe(12);
    });

    it("updateIntegrityStatus e getByStatus funzionano", () => {
        const run = vi.fn();

        db.prepare
            .mockReturnValueOnce({ run })
            .mockReturnValueOnce({
                all: vi.fn().mockReturnValue([
                    {
                        id: 13,
                        uuid: "dip-3",
                        integrityStatus: IntegrityStatusEnum.VALID,
                    },
                ]),
            });

        repo.updateIntegrityStatus(13, IntegrityStatusEnum.VALID);
        const found = repo.getByStatus(IntegrityStatusEnum.VALID);

        expect(run).toHaveBeenCalledWith(IntegrityStatusEnum.VALID, 13);
        expect(found).toHaveLength(1);
        expect(found[0].getUuid()).toBe("dip-3");
        expect(found[0].getIntegrityStatus()).toBe(IntegrityStatusEnum.VALID);
    });
});
