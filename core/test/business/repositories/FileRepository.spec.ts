import { beforeEach, describe, expect, it, vi } from "vitest";

import { FileRepository } from "../../../src/repo/impl/FileRepository";
import { FileDAO } from "../../../src/dao/FileDAO";
import { File } from "../../../src/entity/File";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";

describe("FileRepository", () => {
  let dao: {
    getById: ReturnType<typeof vi.fn>;
    getByDocumentId: ReturnType<typeof vi.fn>;
    getByStatus: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    updateIntegrityStatus: ReturnType<typeof vi.fn>;
  };
  let repo: FileRepository;

  beforeEach(() => {
    dao = {
      getById: vi.fn(),
      getByDocumentId: vi.fn(),
      getByStatus: vi.fn(),
      save: vi.fn(),
      updateIntegrityStatus: vi.fn(),
    };

    repo = new FileRepository(dao as unknown as FileDAO);
  });

  it("save delega al DAO", () => {
    const input = new File("file.xml", "/pkg/file.xml", "hash", true, 10);
    const saved = new File(
      "file.xml",
      "/pkg/file.xml",
      "hash",
      true,
      10,
      IntegrityStatusEnum.UNKNOWN,
      99,
    );
    dao.save.mockReturnValue(saved);

    const result = repo.save(input);

    expect(dao.save).toHaveBeenCalledWith(input);
    expect(result).toBe(saved);
  });

  it("getById delega al DAO", () => {
    const file = new File(
      "doc.pdf",
      "/pkg/doc.pdf",
      "hash",
      false,
      7,
      IntegrityStatusEnum.VALID,
      12,
    );
    dao.getById.mockReturnValue(file);

    const result = repo.getById(12);

    expect(dao.getById).toHaveBeenCalledWith(12);
    expect(result).toBe(file);
  });

  it("getByDocumentId delega al DAO", () => {
    const files = [new File("a", "/a", "h", false, 1)];
    dao.getByDocumentId.mockReturnValue(files);

    const result = repo.getByDocumentId(1);

    expect(dao.getByDocumentId).toHaveBeenCalledWith(1);
    expect(result).toBe(files);
  });

  it("getByStatus e updateIntegrityStatus delegano al DAO", () => {
    const files = [new File("b", "/b", "h", true, 2)];
    dao.getByStatus.mockReturnValue(files);

    const result = repo.getByStatus(IntegrityStatusEnum.UNKNOWN);
    repo.updateIntegrityStatus(5, IntegrityStatusEnum.INVALID);

    expect(dao.getByStatus).toHaveBeenCalledWith(IntegrityStatusEnum.UNKNOWN);
    expect(dao.updateIntegrityStatus).toHaveBeenCalledWith(
      5,
      IntegrityStatusEnum.INVALID,
    );
    expect(result).toBe(files);
  });
});
