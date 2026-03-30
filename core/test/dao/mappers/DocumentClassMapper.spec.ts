import { describe, expect, it } from "vitest";

import {
  DocumentClassMapper,
  DocumentClassPersistenceRow,
} from "../../../src/dao/mappers/DocumentClassMapper";
import { DocumentClass } from "../../../src/entity/DocumentClass";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";

describe("DocumentClassMapper", () => {
  it("maps persistence row to domain", () => {
    const row: DocumentClassPersistenceRow = {
      id: 7,
      dipId: 3,
      dipUuid: "dip-uuid",
      uuid: "dc-uuid",
      integrityStatus: "VALID",
      name: "Classe",
      timestamp: "2026-01-01T00:00:00Z",
    };

    const entity = DocumentClassMapper.toDomain(row);
    expect(entity.getId()).toBe(7);
    expect(entity.getDipId()).toBe(3);
    expect(entity.getDipUuid()).toBe("dip-uuid");
    expect(entity.getUuid()).toBe("dc-uuid");
    expect(entity.getIntegrityStatus()).toBe(IntegrityStatusEnum.VALID);
  });

  it("uses UNKNOWN integrity when status is missing", () => {
    const row: DocumentClassPersistenceRow = {
      id: 8,
      dipId: 4,
      dipUuid: "dip-uuid",
      uuid: "dc-uuid-2",
      name: "Classe 2",
      timestamp: "2026-01-02T00:00:00Z",
    };

    const entity = DocumentClassMapper.toDomain(row);
    expect(entity.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
  });

  it("maps domain to dto", () => {
    const entity = new DocumentClass(
      "dip-uuid",
      "dc-uuid",
      "Classe",
      "2026-01-01T00:00:00Z",
      IntegrityStatusEnum.INVALID,
      12,
      5,
    );

    const dto = DocumentClassMapper.toDTO(entity);
    expect(dto).toEqual({
      id: 12,
      dipId: 5,
      uuid: "dc-uuid",
      name: "Classe",
      timestamp: "2026-01-01T00:00:00Z",
      integrityStatus: IntegrityStatusEnum.INVALID,
    });
  });

  it("uses -1 dipId in dto when dipId is null", () => {
    const entity = new DocumentClass(
      "dip-uuid",
      "dc-uuid",
      "Classe",
      "2026-01-01T00:00:00Z",
      IntegrityStatusEnum.UNKNOWN,
      13,
      null,
    );

    const dto = DocumentClassMapper.toDTO(entity);
    expect(dto.dipId).toBe(-1);
  });

  it("throws when converting to dto with null id", () => {
    const entity = new DocumentClass(
      "dip-uuid",
      "dc-uuid",
      "Classe",
      "2026-01-01T00:00:00Z",
    );

    expect(() => DocumentClassMapper.toDTO(entity)).toThrow(
      "Cannot convert to DTO: DocumentClass entity is not yet persisted and has no ID.",
    );
  });

  it("maps domain to persistence model", () => {
    const entity = new DocumentClass(
      "dip-uuid",
      "dc-uuid",
      "Classe",
      "2026-01-01T00:00:00Z",
      IntegrityStatusEnum.VALID,
      1,
      2,
    );

    const model = DocumentClassMapper.toPersistence(entity);
    expect(model).toEqual({
      dipUuid: "dip-uuid",
      uuid: "dc-uuid",
      integrityStatus: IntegrityStatusEnum.VALID,
      name: "Classe",
      timestamp: "2026-01-01T00:00:00Z",
    });
  });
});
