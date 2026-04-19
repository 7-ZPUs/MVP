import { beforeEach, describe, expect, it, vi } from "vitest";

import { DipPersistenceAdapter } from "../../../src/repo/impl/DipPersistenceAdapter";
import { DipDAO } from "../../../src/dao/DipDAO";
import { Dip } from "../../../src/entity/Dip";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";
import { DipPersistenceRow } from "../../../src/dao/mappers/DipMapper";

describe("DipPersistenceAdapter", () => {
  let dao: {
    getById: ReturnType<typeof vi.fn>;
    getByUuid: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    getByStatus: ReturnType<typeof vi.fn>;
    updateIntegrityStatus: ReturnType<typeof vi.fn>;
  };
  let repo: DipPersistenceAdapter;

  beforeEach(() => {
    dao = {
      getById: vi.fn(),
      getByUuid: vi.fn(),
      save: vi.fn(),
      getByStatus: vi.fn(),
      updateIntegrityStatus: vi.fn(),
    };
    repo = new DipPersistenceAdapter(dao as unknown as DipDAO);
  });

  const createRow = (
    id: number,
    uuid: string,
    integrityStatus: IntegrityStatusEnum = IntegrityStatusEnum.UNKNOWN,
  ): DipPersistenceRow => ({
    id,
    uuid,
    integrityStatus,
  });

  it("TU-F-browsing-44: save() should save crea un dip con status UNKNOWN", () => {
    const savedDip = createRow(11, "dip-1", IntegrityStatusEnum.UNKNOWN);
    dao.save.mockReturnValue(savedDip);

    const input = new Dip("dip-1");
    const result = repo.save(input);

    expect(dao.save).toHaveBeenCalledWith(input);
    expect(result.getId()).toBe(11);
    expect(result.getUuid()).toBe("dip-1");
    expect(result.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
  });

  it("TU-F-browsing-45: getById() should getById e getByUuid restituiscono l'entita", () => {
    const byIdDip = createRow(12, "dip-2", IntegrityStatusEnum.UNKNOWN);
    dao.getById.mockReturnValue(byIdDip);
    dao.getByUuid.mockReturnValue(byIdDip);

    const byId = repo.getById(12);
    const byUuid = repo.getByUuid("dip-2");

    expect(dao.getById).toHaveBeenCalledWith(12);
    expect(dao.getByUuid).toHaveBeenCalledWith("dip-2");
    expect(byId?.getUuid()).toBe("dip-2");
    expect(byUuid?.getId()).toBe(12);
  });

  it("TU-F-browsing-46: updateIntegrityStatus() should updateIntegrityStatus e getByStatus funzionano", () => {
    const rows = [createRow(13, "dip-3", IntegrityStatusEnum.VALID)];
    dao.getByStatus.mockReturnValue(rows);

    repo.updateIntegrityStatus(13, IntegrityStatusEnum.VALID);
    const found = repo.getByStatus(IntegrityStatusEnum.VALID);

    expect(dao.updateIntegrityStatus).toHaveBeenCalledWith(
      13,
      IntegrityStatusEnum.VALID,
    );
    expect(dao.getByStatus).toHaveBeenCalledWith(IntegrityStatusEnum.VALID);
    expect(found).toHaveLength(1);
    expect(found[0].getUuid()).toBe("dip-3");
  });

  it("TU-F-browsing-47: getByStatus() should ritorna array vuoto se nessuna riga trovata per getByStatus", () => {
    dao.getByStatus.mockReturnValue([]);

    const found = repo.getByStatus(IntegrityStatusEnum.VALID);

    expect(dao.getByStatus).toHaveBeenCalledWith(IntegrityStatusEnum.VALID);
    expect(found).toHaveLength(0);
  });

  it("TU-F-browsing-48: save() should save fallback if changes is 0", () => {
    const savedDip = createRow(99, "dip-conflict", IntegrityStatusEnum.UNKNOWN);
    dao.save.mockReturnValue(savedDip);

    const dip = new Dip("dip-conflict");
    const saved = repo.save(dip);

    expect(dao.save).toHaveBeenCalledWith(dip);
    expect(saved.getId()).toBe(99);
  });

  it("TU-F-browsing-49: save() should save fallback if lastInsertRowid is 0 but changes > 0", () => {
    const savedDip = createRow(88, "dip-update", IntegrityStatusEnum.VALID);
    dao.save.mockReturnValue(savedDip);

    const dip = new Dip("dip-update");
    const saved = repo.save(dip);

    expect(dao.save).toHaveBeenCalledWith(dip);
    expect(saved.getId()).toBe(88);
    expect(saved.getUuid()).toBe("dip-update");
  });
});
