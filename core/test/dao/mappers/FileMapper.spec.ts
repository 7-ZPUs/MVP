import { describe, expect, it } from "vitest";

import {
  FileMapper,
  FilePersistenceRow,
} from "../../../src/dao/mappers/FileMapper";
import { File } from "../../../src/entity/File";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";

describe("FileMapper", () => {
  it("maps persistence row to domain", () => {
    const row: FilePersistenceRow = {
      id: 9,
      uuid: "file-uuid",
      filename: "main.xml",
      path: "/pkg/main.xml",
      hash: "hash-1",
      integrityStatus: "VALID",
      isMain: 1,
      documentId: 3,
      documentUuid: "doc-uuid",
    };

    const entity = FileMapper.toDomain(row);
    expect(entity.getId()).toBe(9);
    expect(entity.getUuid()).toBe("file-uuid");
    expect(entity.getFilename()).toBe("main.xml");
    expect(entity.getIsMain()).toBe(true);
    expect(entity.getDocumentId()).toBe(3);
    expect(entity.getDocumentUuid()).toBe("doc-uuid");
    expect(entity.getIntegrityStatus()).toBe(IntegrityStatusEnum.VALID);
  });

  it("keeps uuid empty when persistence row has no uuid", () => {
    const row: FilePersistenceRow = {
      id: 9,
      filename: "main.xml",
      path: "/pkg/main.xml",
      hash: "hash-1",
      integrityStatus: "VALID",
      isMain: 1,
      documentId: 3,
      documentUuid: "doc-uuid",
    };

    const entity = FileMapper.toDomain(row);
    expect(entity.getUuid()).toBe("");
  });

  it("falls back to UNKNOWN for invalid status", () => {
    const row: FilePersistenceRow = {
      id: 10,
      uuid: "file-uuid-2",
      filename: "att.txt",
      path: "/pkg/att.txt",
      hash: "hash-2",
      integrityStatus: "NOT_A_STATUS",
      isMain: 0,
      documentId: 4,
      documentUuid: "doc-uuid",
    };

    const entity = FileMapper.toDomain(row);
    expect(entity.getIsMain()).toBe(false);
    expect(entity.getIntegrityStatus()).toBe(IntegrityStatusEnum.UNKNOWN);
  });

  it("maps domain to dto", () => {
    const entity = new File(
      "main.xml",
      "/pkg/main.xml",
      "hash",
      true,
      "file-uuid",
      "doc-uuid",
      IntegrityStatusEnum.INVALID,
      20,
      33,
    );

    const dto = FileMapper.toDTO(entity);
    expect(dto).toEqual({
      id: 20,
      documentId: 33,
      filename: "main.xml",
      path: "/pkg/main.xml",
      hash: "hash",
      integrityStatus: IntegrityStatusEnum.INVALID,
      isMain: true,
    });
  });

  it("uses -1 documentId in dto when documentId is null", () => {
    const entity = new File(
      "main.xml",
      "/pkg/main.xml",
      "hash",
      true,
      "file-uuid",
      "doc-uuid",
      IntegrityStatusEnum.UNKNOWN,
      21,
      null,
    );

    const dto = FileMapper.toDTO(entity);
    expect(dto.documentId).toBe(-1);
  });

  it("throws when converting to dto with null id", () => {
    const entity = new File(
      "main.xml",
      "/pkg/main.xml",
      "hash",
      true,
      "file-uuid",
      "doc-uuid",
    );

    expect(() => FileMapper.toDTO(entity)).toThrow(
      "Cannot convert to DTO: File entity is not yet persisted and has no ID.",
    );
  });

  it("maps domain to persistence model", () => {
    const entity = new File(
      "main.xml",
      "/pkg/main.xml",
      "hash",
      false,
      "file-uuid",
      "doc-uuid",
      IntegrityStatusEnum.VALID,
      1,
      2,
    );

    const model = FileMapper.toPersistence(entity);
    expect(model).toEqual({
      filename: "main.xml",
      path: "/pkg/main.xml",
      hash: "hash",
      integrityStatus: IntegrityStatusEnum.VALID,
      isMain: 0,
      uuid: "file-uuid",
      documentUuid: "doc-uuid",
    });
  });
});
