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

  // identifier: TU-F-browsing-50
  // method_name: save()
  // description: should save e getById funzionano
  // expected_value: matches asserted behavior: save e getById funzionano
  it("TU-F-browsing-50: save() should save e getById funzionano", () => {
    db.prepare
      .mockReturnValueOnce({
        run: vi.fn().mockReturnValue({ lastInsertRowid: 21 }),
      }) // INSERT query
      .mockReturnValueOnce({
        // Fallback SELECT id query (called because lastInsertRowid might be considered falsy or just to be safe in the mock chain)
        get: vi.fn().mockReturnValue({ id: 21 }),
      })
      .mockReturnValueOnce({
        // getById query
        get: vi.fn().mockReturnValue({
          id: 21,
          dipId: 10,
          uuid: "dc-1",
          integrityStatus: IntegrityStatusEnum.UNKNOWN,
          name: "Contratti",
          timestamp: "2024-01-01T00:00:00Z",
        }),
      });

    const dc = new DocumentClass(
      "dip-uuid",
      "dc-1",
      "Contratti",
      "2024-01-01T00:00:00Z",
    );
    dc.setIntegrityStatus(IntegrityStatusEnum.INVALID);

    repo.save(dc);
    const found = repo.getById(21);

    expect(found?.getDipId()).toBe(10);
    expect(found?.getUuid()).toBe("dc-1");
    expect(found?.getName()).toBe("Contratti");
    expect(found?.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
  });

  // identifier: TU-F-browsing-51
  // method_name: getByDipId()
  // description: should getByDipId, getByStatus e updateIntegrityStatus funzionano
  // expected_value: matches asserted behavior: getByDipId, getByStatus e updateIntegrityStatus funzionano
  it("TU-F-browsing-51: getByDipId() should getByDipId, getByStatus e updateIntegrityStatus funzionano", () => {
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

  // identifier: TU-F-browsing-52
  // method_name: search()
  // description: should search restituisce risultati o null
  // expected_value: matches asserted behavior: search restituisce risultati o null
  it("TU-F-browsing-52: search() should search restituisce risultati o null", () => {
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

  // identifier: TU-F-browsing-53
  // method_name: save()
  // description: should save fallback per lastInsertRowid falsy e exception per fallimento
  // expected_value: matches asserted behavior: save fallback per lastInsertRowid falsy e exception per fallimento
  it("TU-F-browsing-53: save() should save fallback per lastInsertRowid falsy e exception per fallimento", () => {
    // Mock chain for throws Error
    db.prepare.mockImplementation((query: string) => {
      return {
        run: vi.fn().mockReturnValue({ lastInsertRowid: 0 }),
        get: vi.fn().mockReturnValue(null),
      };
    });

    const dc = new DocumentClass(
      "dip-1",
      "dc-err",
      "Err",
      "2024-01-01T00:00:00Z",
    );
    expect(() => repo.save(dc)).toThrowError(
      "Failed to save DocumentClass with uuid=dc-err",
    );
  });

  // identifier: TU-F-browsing-54
  // method_name: getAggregatedIntegrityStatusByDipId()
  // description: should getAggregatedIntegrityStatusByDipId return logic
  // expected_value: matches asserted behavior: getAggregatedIntegrityStatusByDipId return logic
  it("TU-F-browsing-54: getAggregatedIntegrityStatusByDipId() should getAggregatedIntegrityStatusByDipId return logic", () => {
    const getMock = vi.fn();
    db.prepare.mockReturnValue({ get: getMock });

    // Branch 1: !total -> UNKNOWN
    getMock.mockReturnValueOnce({ total: 0, invalidCount: 0, unknownCount: 0 });
    expect(repo.getAggregatedIntegrityStatusByDipId(1)).toBe(
      IntegrityStatusEnum.UNKNOWN,
    );

    getMock.mockReturnValueOnce(null);
    expect(repo.getAggregatedIntegrityStatusByDipId(1)).toBe(
      IntegrityStatusEnum.UNKNOWN,
    );

    // Branch 2: invalidCount -> INVALID
    getMock.mockReturnValueOnce({ total: 5, invalidCount: 1, unknownCount: 0 });
    expect(repo.getAggregatedIntegrityStatusByDipId(2)).toBe(
      IntegrityStatusEnum.INVALID,
    );

    // Branch 3: unknownCount -> UNKNOWN
    getMock.mockReturnValueOnce({ total: 5, invalidCount: 0, unknownCount: 2 });
    expect(repo.getAggregatedIntegrityStatusByDipId(3)).toBe(
      IntegrityStatusEnum.UNKNOWN,
    );

    // Branch 4: valid
    getMock.mockReturnValueOnce({ total: 5, invalidCount: 0, unknownCount: 0 });
    expect(repo.getAggregatedIntegrityStatusByDipId(4)).toBe(
      IntegrityStatusEnum.VALID,
    );
  });
});
