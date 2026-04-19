import { beforeEach, describe, expect, it, vi } from "vitest";

import { DocumentClassPersistenceAdapter } from "../../../src/repo/impl/DocumentClassPersistenceAdapter";
import { DocumentClassDAO } from "../../../src/dao/DocumentClassDAO";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";
import { DocumentClass } from "../../../src/entity/DocumentClass";
import { DocumentClassPersistenceRow } from "../../../src/dao/mappers/DocumentClassMapper";

describe("DocumentClassPersistenceAdapter", () => {
  let dao: {
    getById: ReturnType<typeof vi.fn>;
    getByDipId: ReturnType<typeof vi.fn>;
    getByStatus: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    search: ReturnType<typeof vi.fn>;
    updateIntegrityStatus: ReturnType<typeof vi.fn>;
  };
  let repo: DocumentClassPersistenceAdapter;

  beforeEach(() => {
    dao = {
      getById: vi.fn(),
      getByDipId: vi.fn(),
      getByStatus: vi.fn(),
      save: vi.fn(),
      search: vi.fn(),
      updateIntegrityStatus: vi.fn(),
    };
    repo = new DocumentClassPersistenceAdapter(
      dao as unknown as DocumentClassDAO,
    );
  });

  const createRow = (
    id: number,
    uuid: string,
    name: string,
    status: IntegrityStatusEnum = IntegrityStatusEnum.UNKNOWN,
  ): DocumentClassPersistenceRow => ({
    id,
    dipId: 10,
    dipUuid: "dip-uuid",
    uuid,
    integrityStatus: status,
    name,
    timestamp: "2024-01-01T00:00:00Z",
  });

  it("TU-F-browsing-50: save() should save e getById funzionano", () => {
    const saved = createRow(21, "dc-1", "Contratti");
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
    const rows = [createRow(31, "dc-2", "Fatture", IntegrityStatusEnum.VALID)];
    rows[0].dipId = 20;
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
      .mockReturnValueOnce([createRow(32, "dc-3", "Verbali CdA")])
      .mockReturnValueOnce([]);

    const found = repo.searchDocumentalClasses("Verbali");
    const notFound = repo.searchDocumentalClasses("inesistente");

    expect(dao.search).toHaveBeenCalledWith("Verbali");
    expect(dao.search).toHaveBeenCalledWith("inesistente");
    expect(found).toHaveLength(1);
    expect(found[0].getName()).toContain("Verbali");
    expect(notFound).toEqual([]);
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

  it("TU-F-browsing-54: getById() should return null quando la classe non esiste", () => {
    dao.getById.mockReturnValue(null);

    const result = repo.getById(404);

    expect(dao.getById).toHaveBeenCalledWith(404);
    expect(result).toBeNull();
  });
});
