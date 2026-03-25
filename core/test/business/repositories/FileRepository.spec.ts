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

  it("save e getById funzionano", () => {
    db.prepare.mockImplementation((query: string) => {
      const isInsert = query.includes("INSERT INTO file");
      const isSelect = query.includes("FROM file WHERE id = ?");

      return {
        run: vi.fn().mockImplementation(() => {
          if (isInsert) return { lastInsertRowid: 71 };
          return {};
        }),
        get: vi.fn().mockImplementation(() => {
          if (isSelect) return {
            id: 71,
            filename: "main.xml",
            path: "/pkg/main.xml",
            integrityStatus: IntegrityStatusEnum.UNKNOWN,
            isMain: 1,
            documentId: 3,
          };
          return null;
        })
      };
    });

    const file = new File("main.xml", "/pkg/main.xml", "hash-main", true, "doc-uuid");

    repo.save(file);

    const found = repo.getById(71);

    expect(found).not.toBeNull();
    expect(found?.getFilename()).toBe("main.xml");
    expect(found?.getPath()).toBe("/pkg/main.xml");
    expect(found?.getDocumentId()).toBe(3);
    expect(found?.getIsMain()).toBe(true);
    expect(found?.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
  });

  it("getByDocumentId, getByStatus e updateIntegrityStatus funzionano", () => {
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
});
