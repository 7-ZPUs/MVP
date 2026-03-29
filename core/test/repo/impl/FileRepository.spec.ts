import { beforeEach, describe, expect, it, vi } from "vitest";

import { FileRepository } from "../../../src/repo/impl/FileRepository";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";
import { DatabaseProvider } from "../../../src/repo/impl/DatabaseProvider";
import { File } from "../../../src/entity/File";

describe("FileRepository", () => {
  const makeDb = () => ({
    exec: vi.fn(),
    prepare: vi.fn(),
  });

  let db: ReturnType<typeof makeDb>;
  let repo: FileRepository;

  beforeEach(() => {
    db = makeDb();
    repo = new FileRepository({ db } as unknown as DatabaseProvider);
  });

  // identifier: TU-F-browsing-64
  // method_name: save()
  // description: should save e getById funzionano
  // expected_value: matches asserted behavior: save e getById funzionano
  it("TU-F-browsing-64: save() should save e getById funzionano", () => {
    db.prepare.mockImplementation((query: string) => {
      const isInsert = query.includes("INSERT INTO file");
      const isSelect = query.includes("FROM file WHERE id = ?");

      return {
        run: vi.fn().mockImplementation(() => {
          if (isInsert) return { lastInsertRowid: 71 };
          return {};
        }),
        get: vi.fn().mockImplementation(() => {
          if (isSelect)
            return {
              id: 71,
              filename: "main.xml",
              path: "/pkg/main.xml",
              integrityStatus: IntegrityStatusEnum.UNKNOWN,
              isMain: 1,
              documentId: 3,
            };
          return null;
        }),
      };
    });

    const file = new File(
      "main.xml",
      "/pkg/main.xml",
      "hash-main",
      true,
      "doc-uuid",
    );

    repo.save(file);

    const found = repo.getById(71);

    expect(found).not.toBeNull();
    expect(found?.getFilename()).toBe("main.xml");
    expect(found?.getPath()).toBe("/pkg/main.xml");
    expect(found?.getDocumentId()).toBe(3);
    expect(found?.getIsMain()).toBe(true);
    expect(found?.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
  });

  // identifier: TU-F-browsing-65
  // method_name: getByDocumentId()
  // description: should getByDocumentId, getByStatus e updateIntegrityStatus funzionano
  // expected_value: matches asserted behavior: getByDocumentId, getByStatus e updateIntegrityStatus funzionano
  it("TU-F-browsing-65: getByDocumentId() should getByDocumentId, getByStatus e updateIntegrityStatus funzionano", () => {
    const run = vi.fn();

    db.prepare
      .mockReturnValueOnce({
        all: vi.fn().mockReturnValue([
          {
            id: 72,
            filename: "allegato.pdf",
            path: "/pkg/allegato.pdf",
            integrityStatus: IntegrityStatusEnum.INVALID,
            isMain: 0,
            documentId: 4,
          },
        ]),
      })
      .mockReturnValueOnce({ run })
      .mockReturnValueOnce({
        all: vi.fn().mockReturnValue([
          {
            id: 72,
            filename: "allegato.pdf",
            path: "/pkg/allegato.pdf",
            integrityStatus: IntegrityStatusEnum.INVALID,
            isMain: 0,
            documentId: 4,
          },
        ]),
      });

    expect(repo.getByDocumentId(4)).toHaveLength(1);

    repo.updateIntegrityStatus(72, IntegrityStatusEnum.INVALID);
    const byStatus = repo.getByStatus(IntegrityStatusEnum.INVALID);

    expect(run).toHaveBeenCalledWith(IntegrityStatusEnum.INVALID, 72);
    expect(byStatus).toHaveLength(1);
    expect(byStatus[0].getFilename()).toBe("allegato.pdf");
    expect(byStatus[0].getIntegrityStatus()).toBe(IntegrityStatusEnum.INVALID);
  });

  // identifier: TU-F-browsing-66
  // method_name: save()
  // description: should save con fallback quando lastInsertRowid è falsy
  // expected_value: matches asserted behavior: save con fallback quando lastInsertRowid è falsy
  it("TU-F-browsing-66: save() should save con fallback quando lastInsertRowid è falsy", () => {
    // query is called multiple times.
    db.prepare.mockImplementation((query: string) => {
      const isInsert = query.includes("INSERT INTO file");
      const isSelectDocId = query.includes("SELECT id FROM document");
      const isSelectFileId = query.includes("SELECT id FROM file");
      const isSelectById = query.includes("FROM file WHERE id = ?");

      return {
        run: vi.fn().mockImplementation(() => {
          if (isInsert) return { lastInsertRowid: 0 };
          return {};
        }),
        get: vi.fn().mockImplementation(() => {
          if (isSelectDocId) return { id: 3 };
          if (isSelectFileId) return { id: 88 };
          if (isSelectById)
            return {
              id: 88,
              filename: "fallback.xml",
              path: "/pkg/fallback.xml",
              integrityStatus: IntegrityStatusEnum.UNKNOWN,
              isMain: 1,
              documentId: 3,
            };
          return null;
        }),
      };
    });

    const file = new File(
      "fallback.xml",
      "/pkg/fallback.xml",
      "hash",
      true,
      "doc-uuid",
    );
    const saved = repo.save(file);
    expect(saved.getId()).toBe(88);
  });

  // identifier: TU-F-browsing-67
  // method_name: getAggregatedIntegrityStatusByDocumentId()
  // description: should getAggregatedIntegrityStatusByDocumentId return logic
  // expected_value: matches asserted behavior: getAggregatedIntegrityStatusByDocumentId return logic
  it("TU-F-browsing-67: getAggregatedIntegrityStatusByDocumentId() should getAggregatedIntegrityStatusByDocumentId return logic", () => {
    const getMock = vi.fn();
    db.prepare.mockReturnValue({ get: getMock });

    // Branch 1: !total -> UNKNOWN
    getMock.mockReturnValueOnce({ total: 0, invalidCount: 0, unknownCount: 0 });
    expect(repo.getAggregatedIntegrityStatusByDocumentId(1)).toBe(
      IntegrityStatusEnum.UNKNOWN,
    );

    // null row defaults
    getMock.mockReturnValueOnce(null);
    expect(repo.getAggregatedIntegrityStatusByDocumentId(1)).toBe(
      IntegrityStatusEnum.UNKNOWN,
    );

    // Branch 2: invalidCount -> INVALID
    getMock.mockReturnValueOnce({ total: 5, invalidCount: 1, unknownCount: 0 });
    expect(repo.getAggregatedIntegrityStatusByDocumentId(2)).toBe(
      IntegrityStatusEnum.INVALID,
    );

    // Branch 3: unknownCount -> UNKNOWN
    getMock.mockReturnValueOnce({ total: 5, invalidCount: 0, unknownCount: 2 });
    expect(repo.getAggregatedIntegrityStatusByDocumentId(3)).toBe(
      IntegrityStatusEnum.UNKNOWN,
    );

    // Branch 4: else -> VALID
    getMock.mockReturnValueOnce({ total: 5, invalidCount: 0, unknownCount: 0 });
    expect(repo.getAggregatedIntegrityStatusByDocumentId(4)).toBe(
      IntegrityStatusEnum.VALID,
    );
  });
});
