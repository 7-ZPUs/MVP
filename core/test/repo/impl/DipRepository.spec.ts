import { beforeEach, describe, expect, it, vi } from "vitest";

import { DipRepository } from "../../../src/repo/impl/DipRepository";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";
import { DatabaseProvider } from "../../../src/repo/impl/DatabaseProvider";
import { Dip } from "../../../src/entity/Dip";

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

  // identifier: TU-F-browsing-44
  // method_name: save()
  // description: should save crea un dip con status UNKNOWN
  // expected_value: matches asserted behavior: save crea un dip con status UNKNOWN
  it("TU-F-browsing-44: save() should save crea un dip con status UNKNOWN", () => {
    db.prepare.mockReturnValueOnce({
      run: vi.fn().mockReturnValue({ lastInsertRowid: 11 }),
    });

    const dip = new Dip("dip-1");
    dip.setIntegrityStatus(IntegrityStatusEnum.VALID);

    const saved = repo.save(dip);

    expect(saved.getId()).toBeTypeOf("number");
    expect(saved.getUuid()).toBe("dip-1");
    expect(saved.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
  });

  // identifier: TU-F-browsing-45
  // method_name: getById()
  // description: should getById e getByUuid restituiscono l'entità
  // expected_value: returns entity values for both id and uuid lookups
  it("TU-F-browsing-45: getById() should getById e getByUuid restituiscono l'entità", () => {
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

  // identifier: TU-F-browsing-46
  // method_name: updateIntegrityStatus()
  // description: should updateIntegrityStatus e getByStatus funzionano
  // expected_value: updates state as asserted: updateIntegrityStatus e getByStatus funzionano
  it("TU-F-browsing-46: updateIntegrityStatus() should updateIntegrityStatus e getByStatus funzionano", () => {
    const run = vi.fn();

    db.prepare.mockReturnValueOnce({ run }).mockReturnValueOnce({
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

  // identifier: TU-F-browsing-47
  // method_name: getByStatus()
  // description: should ritorna array vuoto se nessuna riga trovata per getByStatus
  // expected_value: matches asserted behavior: ritorna array vuoto se nessuna riga trovata per getByStatus
  it("TU-F-browsing-47: getByStatus() should ritorna array vuoto se nessuna riga trovata per getByStatus", () => {
    db.prepare.mockReturnValueOnce({
      all: vi.fn().mockReturnValue([]),
    });
    const found = repo.getByStatus(IntegrityStatusEnum.VALID);
    expect(found).toHaveLength(0);
  });

  // identifier: TU-F-browsing-48
  // method_name: save()
  // description: should save fallback if changes is 0
  // expected_value: matches asserted behavior: save fallback if changes is 0
  it("TU-F-browsing-48: save() should save fallback if changes is 0", () => {
    db.prepare
      .mockReturnValueOnce({
        run: vi.fn().mockReturnValue({ changes: 0, lastInsertRowid: 0 }),
      })
      .mockReturnValueOnce({
        get: vi.fn().mockReturnValue({
          id: 99,
          uuid: "dip-conflict",
          integrityStatus: IntegrityStatusEnum.UNKNOWN,
        }),
      });

    const dip = new Dip("dip-conflict");
    const saved = repo.save(dip);

    expect(saved.getId()).toBe(99);
    expect(saved.getUuid()).toBe("dip-conflict");
  });

  // identifier: TU-F-browsing-49
  // method_name: save()
  // description: should save fallback if lastInsertRowid is 0 but changes > 0
  // expected_value: matches asserted behavior: save fallback if lastInsertRowid is 0 but changes > 0
  it("TU-F-browsing-49: save() should save fallback if lastInsertRowid is 0 but changes > 0", () => {
    db.prepare
      .mockReturnValueOnce({
        run: vi.fn().mockReturnValue({ changes: 1, lastInsertRowid: 0 }),
      })
      .mockReturnValueOnce({
        get: vi.fn().mockReturnValue({
          id: 88,
          uuid: "dip-update",
          integrityStatus: IntegrityStatusEnum.VALID,
        }),
      });

    const dip = new Dip("dip-update");
    const saved = repo.save(dip);

    expect(saved.getId()).toBe(88);
    expect(saved.getUuid()).toBe("dip-update");
  });
});
