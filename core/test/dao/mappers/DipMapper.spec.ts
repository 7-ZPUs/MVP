import { describe, expect, it } from "vitest";

import {
  DipMapper,
  DipPersistenceRow,
} from "../../../src/dao/mappers/DipMapper";
import { Dip } from "../../../src/entity/Dip";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";

describe("DipMapper", () => {
  it("maps persistence row to domain", () => {
    const row: DipPersistenceRow = {
      id: 10,
      uuid: "dip-uuid",
      integrityStatus: "VALID",
    };

    const dip = DipMapper.toDomain(row);
    expect(dip.getId()).toBe(10);
    expect(dip.getUuid()).toBe("dip-uuid");
    expect(dip.getIntegrityStatus()).toBe(IntegrityStatusEnum.VALID);
  });

  it("falls back to UNKNOWN for invalid status", () => {
    const row: DipPersistenceRow = {
      id: 11,
      uuid: "dip-uuid-2",
      integrityStatus: "NOT_A_STATUS",
    };

    const dip = DipMapper.toDomain(row);
    expect(dip.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
  });

  it("maps domain to dto", () => {
    const dip = new Dip("dip-uuid", IntegrityStatusEnum.INVALID, 42);
    const dto = DipMapper.toDTO(dip);

    expect(dto.id).toBe(42);
    expect(dto.uuid).toBe("dip-uuid");
    expect(dto.integrityStatus).toBe(IntegrityStatusEnum.INVALID);
  });

  it("throws when converting to dto with null id", () => {
    const dip = new Dip("dip-uuid");
    expect(() => DipMapper.toDTO(dip)).toThrow(
      "Cannot convert Dip to DTO: id is null",
    );
  });

  it("maps domain to persistence model", () => {
    const dip = new Dip("dip-uuid", IntegrityStatusEnum.VALID, 1);
    const model = DipMapper.toPersistence(dip);

    expect(model).toEqual({
      uuid: "dip-uuid",
      integrityStatus: IntegrityStatusEnum.VALID,
    });
  });
});
