import { beforeEach, describe, expect, it, vi } from "vitest";

import { DocumentRepository } from "../../../src/repo/impl/DocumentRepository";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";
import { DatabaseProvider } from "../../../src/repo/impl/DatabaseProvider";

describe("DocumentRepository", () => {
    const makeDb = () => ({
        exec: vi.fn(),
        prepare: vi.fn(),
    });

    let db: ReturnType<typeof makeDb>;
    let repo: DocumentRepository;

    beforeEach(() => {
        db = makeDb();
        repo = new DocumentRepository({ db } as unknown as DatabaseProvider);
    });

    it("save persiste documento e metadata", () => {
        const insertDocRun = vi.fn().mockReturnValue({ lastInsertRowid: 51 });
        const insertMetadataRun = vi.fn();
        const getDoc = vi.fn().mockReturnValue({
            id: 51,
            uuid: "doc-1",
            integrityStatus: IntegrityStatusEnum.UNKNOWN,
            processId: 7,
        });
        const loadMetadataAll = vi.fn().mockReturnValue([
            { id: 1, document_id: 51, name: "titolo", value: "Documento A", type: "string" },
            { id: 2, document_id: 51, name: "anno", value: "2026", type: "number" },
        ]);

        db.prepare
            .mockReturnValueOnce({ run: insertDocRun })
            .mockReturnValueOnce({ run: insertMetadataRun })
            .mockReturnValueOnce({ get: getDoc })
            .mockReturnValueOnce({ all: loadMetadataAll });

        const saved = repo.save({
            processId: 7,
            uuid: "doc-1",
            metadata: [
                { name: "titolo", value: "Documento A", type: "string" },
                { name: "anno", value: "2026", type: "number" },
            ],
        });
        const found = repo.getById(saved.toDTO().id);

        expect(found).not.toBeNull();
        expect(found?.getUuid()).toBe("doc-1");
        expect(found?.getProcessId()).toBe(7);
        expect(found?.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
        expect(found?.getMetadata()).toHaveLength(2);
        expect(found?.getMetadata()[0].name).toBe("titolo");
        expect(insertMetadataRun).toHaveBeenCalledTimes(2);
    });

    it("getByProcessId, getByStatus e updateIntegrityStatus funzionano", () => {
        const run = vi.fn();
        const row = {
            id: 61,
            uuid: "doc-2",
            integrityStatus: IntegrityStatusEnum.VALID,
            processId: 8,
        };

        db.prepare
            .mockReturnValueOnce({ all: vi.fn().mockReturnValue([row]) })
            .mockReturnValueOnce({ all: vi.fn().mockReturnValue([]) })
            .mockReturnValueOnce({ run })
            .mockReturnValueOnce({ all: vi.fn().mockReturnValue([row]) })
            .mockReturnValueOnce({ all: vi.fn().mockReturnValue([]) });

        expect(repo.getByProcessId(8)).toHaveLength(1);

        repo.updateIntegrityStatus(61, IntegrityStatusEnum.VALID);
        const byStatus = repo.getByStatus(IntegrityStatusEnum.VALID);

        expect(run).toHaveBeenCalledWith(IntegrityStatusEnum.VALID, 61);
        expect(byStatus).toHaveLength(1);
        expect(byStatus[0].getUuid()).toBe("doc-2");
        expect(byStatus[0].getIntegrityStatus()).toBe(IntegrityStatusEnum.VALID);
    });
});
