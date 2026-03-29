import { beforeEach, describe, expect, it, vi } from "vitest";

import { DocumentClassRepository } from "../../../src/repo/impl/DocumentClassRepository";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";
import { DatabaseProvider } from "../../../src/repo/impl/DatabaseProvider";
import { DocumentClass } from "../../../src/entity/DocumentClass";

describe("DocumentClassRepository", () => {
    const makeDb = () => ({
        exec: vi.fn(),
        prepare: vi.fn(),
    });

    let db: ReturnType<typeof makeDb>;
    let repo: DocumentClassRepository;

    beforeEach(() => {
        db = makeDb();
        repo = new DocumentClassRepository({ db } as unknown as DatabaseProvider);
    });

    it("save e getById funzionano", () => {
        db.prepare
            .mockReturnValueOnce({ run: vi.fn().mockReturnValue({ lastInsertRowid: 21 }) })
            .mockReturnValueOnce({
                get: vi.fn().mockReturnValue({
                    id: 21,
                    dipId: 10,
                    uuid: "dc-1",
                    integrityStatus: IntegrityStatusEnum.UNKNOWN,
                    name: "Contratti",
                    timestamp: "2024-01-01T00:00:00Z",
                }),
            });

        const dc = new DocumentClass(10, "dc-1", "Contratti", "2024-01-01T00:00:00Z");
        dc.setIntegrityStatus(IntegrityStatusEnum.INVALID);

        repo.save(dc);
        const found = repo.getById(21);

        expect(found?.getProcessId()).toBe(10);
        expect(found?.getUuid()).toBe("dc-1");
        expect(found?.getName()).toBe("Contratti");
        expect(found?.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
    });

    it("getByDipId, getByStatus e updateIntegrityStatus funzionano", () => {
        const run = vi.fn();

        db.prepare
            .mockReturnValueOnce({
                all: vi.fn().mockReturnValue([
                    {
                        id: 31,
                        dipId: 20,
                        uuid: "dc-2",
                        integrityStatus: IntegrityStatusEnum.UNKNOWN,
                        name: "Fatture",
                        timestamp: "2024-02-02T00:00:00Z",
                    },
                ]),
            })
            .mockReturnValueOnce({ run })
            .mockReturnValueOnce({
                all: vi.fn().mockReturnValue([
                    {
                        id: 31,
                        dipId: 20,
                        uuid: "dc-2",
                        integrityStatus: IntegrityStatusEnum.VALID,
                        name: "Fatture",
                        timestamp: "2024-02-02T00:00:00Z",
                    },
                ]),
            });

        expect(repo.getByDipId(20)).toHaveLength(1);

        repo.updateIntegrityStatus(31, IntegrityStatusEnum.VALID);
        const byStatus = repo.getByStatus(IntegrityStatusEnum.VALID);

        expect(run).toHaveBeenCalledWith(IntegrityStatusEnum.VALID, 31);
        expect(byStatus).toHaveLength(1);
        expect(byStatus[0].getUuid()).toBe("dc-2");
    });

    it("search restituisce risultati o null", () => {
        db.prepare
            .mockReturnValueOnce({
                all: vi.fn().mockReturnValue([
                    {
                        id: 41,
                        dipId: 30,
                        uuid: "dc-3",
                        integrityStatus: IntegrityStatusEnum.UNKNOWN,
                        name: "Verbali CdA",
                        timestamp: "2024-03-03T00:00:00Z",
                    },
                ]),
            })
            .mockReturnValueOnce({ all: vi.fn().mockReturnValue([]) });

        const found = repo.search("Verbali");
        const notFound = repo.search("inesistente");

        expect(found).not.toBeNull();
        expect(found?.[0].getName()).toContain("Verbali");
        expect(notFound).toBeNull();
    });
});
