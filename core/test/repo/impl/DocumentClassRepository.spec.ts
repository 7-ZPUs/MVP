import { beforeEach, describe, expect, it, vi } from "vitest";

import { DocumentClassRepository } from "../../../src/repo/impl/DocumentClassRepository";
import { DocumentClassDAO } from "../../../src/dao/DocumentClassDAO";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";
import { DocumentClass } from "../../../src/entity/DocumentClass";

describe("DocumentClassRepository", () => {
  let dao: {
    getById: ReturnType<typeof vi.fn>;
    getByDipId: ReturnType<typeof vi.fn>;
    getByStatus: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    search: ReturnType<typeof vi.fn>;
    updateIntegrityStatus: ReturnType<typeof vi.fn>;
    getAggregatedIntegrityStatusByDipId: ReturnType<typeof vi.fn>;
  };
  let repo: DocumentClassRepository;

  beforeEach(() => {
    dao = {
      getById: vi.fn(),
      getByDipId: vi.fn(),
      getByStatus: vi.fn(),
      save: vi.fn(),
      search: vi.fn(),
      updateIntegrityStatus: vi.fn(),
      getAggregatedIntegrityStatusByDipId: vi.fn(),
    };
    repo = new DocumentClassRepository(dao as unknown as DocumentClassDAO);
  });

  it("TU-F-browsing-50: save() should save e getById funzionano", () => {
    const saved = new DocumentClass(
      "dip-uuid",
      "dc-1",
      "Contratti",
      "2024-01-01T00:00:00Z",
      IntegrityStatusEnum.UNKNOWN,
      21,
      10,
    );
    dao.save.mockReturnValue(saved);
    dao.getById.mockReturnValue(saved);

    const input = new DocumentClass(
      "dip-uuid",
      "dc-1",
      "Contratti",
      "2024-01-01T00:00:00Z",
    );

    repo.save(input);
    const found = repo.getById(21);

    expect(dao.save).toHaveBeenCalledWith(input);
    expect(dao.getById).toHaveBeenCalledWith(21);
    expect(found?.getDipId()).toBe(10);
    expect(found?.getUuid()).toBe("dc-1");
  });

  it("TU-F-browsing-51: getByDipId() should getByDipId, getByStatus e updateIntegrityStatus funzionano", () => {
    const rows = [
      new DocumentClass(
        "dip-uuid",
        "dc-2",
        "Fatture",
        "2024-02-02T00:00:00Z",
        IntegrityStatusEnum.VALID,
        31,
        20,
      ),
    ];
    dao.getByDipId.mockReturnValue(rows);
    dao.getByStatus.mockReturnValue(rows);

    expect(repo.getByDipId(20)).toHaveLength(1);

    repo.updateIntegrityStatus(31, IntegrityStatusEnum.VALID);
    const byStatus = repo.getByStatus(IntegrityStatusEnum.VALID);

    expect(dao.updateIntegrityStatus).toHaveBeenCalledWith(
      31,
      IntegrityStatusEnum.VALID,
    );
    expect(byStatus).toHaveLength(1);
  });

  it("TU-F-browsing-52: search() should search restituisce risultati o null", () => {
    dao.search
      .mockReturnValueOnce([
        new DocumentClass(
          "dip-uuid",
          "dc-3",
          "Verbali CdA",
          "2024-03-03T00:00:00Z",
        ),
      ])
      .mockReturnValueOnce(null);

    const found = repo.search("Verbali");
    const notFound = repo.search("inesistente");

    expect(found).not.toBeNull();
    expect(found?.[0].getName()).toContain("Verbali");
    expect(notFound).toBeNull();
  });

  it("TU-F-browsing-53: save() should save fallback per lastInsertRowid falsy e exception per fallimento", () => {
    const input = new DocumentClass(
      "dip-1",
      "dc-err",
      "Err",
      "2024-01-01T00:00:00Z",
    );
    dao.save.mockImplementation(() => {
      throw new Error("Failed to save DocumentClass with uuid=dc-err");
    });

    expect(() => repo.save(input)).toThrowError(
      "Failed to save DocumentClass with uuid=dc-err",
    );
  });

  it("TU-F-browsing-54: getAggregatedIntegrityStatusByDipId() should getAggregatedIntegrityStatusByDipId return logic", () => {
    dao.getAggregatedIntegrityStatusByDipId
      .mockReturnValueOnce(IntegrityStatusEnum.UNKNOWN)
      .mockReturnValueOnce(IntegrityStatusEnum.UNKNOWN)
      .mockReturnValueOnce(IntegrityStatusEnum.INVALID)
      .mockReturnValueOnce(IntegrityStatusEnum.UNKNOWN)
      .mockReturnValueOnce(IntegrityStatusEnum.VALID);

    expect(repo.getAggregatedIntegrityStatusByDipId(1)).toBe(
      IntegrityStatusEnum.UNKNOWN,
    );
    expect(repo.getAggregatedIntegrityStatusByDipId(1)).toBe(
      IntegrityStatusEnum.UNKNOWN,
    );
    expect(repo.getAggregatedIntegrityStatusByDipId(2)).toBe(
      IntegrityStatusEnum.INVALID,
    );
    expect(repo.getAggregatedIntegrityStatusByDipId(3)).toBe(
      IntegrityStatusEnum.UNKNOWN,
    );
    expect(repo.getAggregatedIntegrityStatusByDipId(4)).toBe(
      IntegrityStatusEnum.VALID,
    );
  });
});
