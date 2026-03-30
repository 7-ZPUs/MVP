import { beforeEach, describe, expect, it, vi } from "vitest";

import { DocumentRepository } from "../../../src/repo/impl/DocumentRepository";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";
import { Document } from "../../../src/entity/Document";
import { Metadata, MetadataType } from "../../../src/value-objects/Metadata";

describe("DocumentRepository", () => {
  const dao = {
    getById: vi.fn(),
    getByProcessId: vi.fn(),
    getByStatus: vi.fn(),
    save: vi.fn(),
    updateIntegrityStatus: vi.fn(),
    getAggregatedIntegrityStatusByProcessId: vi.fn(),
  };

  let repo: DocumentRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new DocumentRepository(dao as any);
  });

  it("delegates save and getById", () => {
    const metadata = new Metadata(
      "root",
      [
        new Metadata("titolo", "Documento A", MetadataType.STRING),
        new Metadata("anno", "2026", MetadataType.NUMBER),
        new Metadata(
          "soggetto",
          [new Metadata("nome", "Mario", MetadataType.STRING)],
          MetadataType.COMPOSITE,
        ),
      ],
      MetadataType.COMPOSITE,
    );
    const input = new Document("doc-1", metadata, "process-uuid");
    const output = new Document(
      "doc-1",
      metadata,
      "process-uuid",
      IntegrityStatusEnum.UNKNOWN,
      1,
      10,
    );
    dao.save.mockReturnValue(output);
    dao.getById.mockReturnValue(output);

    expect(repo.save(input)).toBe(output);
    expect(repo.getById(1)).toBe(output);
    expect(dao.save).toHaveBeenCalledWith(input);
    expect(dao.getById).toHaveBeenCalledWith(1);
  });

  it("delegates getByProcessId and getByStatus", () => {
    const list = [
      new Document(
        "doc-2",
        new Metadata("root", [], MetadataType.COMPOSITE),
        "process-uuid",
        IntegrityStatusEnum.VALID,
        2,
        20,
      ),
    ];
    dao.getByProcessId.mockReturnValue(list);
    dao.getByStatus.mockReturnValue(list);

    expect(repo.getByProcessId(20)).toBe(list);
    expect(repo.getByStatus(IntegrityStatusEnum.VALID)).toBe(list);
    expect(dao.getByProcessId).toHaveBeenCalledWith(20);
    expect(dao.getByStatus).toHaveBeenCalledWith(IntegrityStatusEnum.VALID);
  });

  it("delegates update and aggregated status", () => {
    dao.getAggregatedIntegrityStatusByProcessId.mockReturnValue(
      IntegrityStatusEnum.INVALID,
    );

    repo.updateIntegrityStatus(7, IntegrityStatusEnum.UNKNOWN);
    expect(repo.getAggregatedIntegrityStatusByProcessId(3)).toBe(
      IntegrityStatusEnum.INVALID,
    );

    expect(dao.updateIntegrityStatus).toHaveBeenCalledWith(
      7,
      IntegrityStatusEnum.UNKNOWN,
    );
    expect(dao.getAggregatedIntegrityStatusByProcessId).toHaveBeenCalledWith(3);
  });
});
