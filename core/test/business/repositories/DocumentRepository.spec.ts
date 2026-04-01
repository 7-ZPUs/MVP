import { beforeEach, describe, expect, it, vi } from "vitest";

import { DocumentRepository } from "../../../src/repo/impl/DocumentRepository";
import { DocumentDAO } from "../../../src/dao/DocumentDAO";
import { Document } from "../../../src/entity/Document";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";
import { Metadata, MetadataType } from "../../../src/value-objects/Metadata";
import { SearchFilters } from "../../../../shared/domain/metadata/search.models";

const emptyFilters: SearchFilters = {
  common: {
    chiaveDescrittiva: null,
    classificazione: null,
    conservazione: null,
    note: null,
    tipoDocumento: null,
  },
  diDai: {
    nome: null,
    versione: null,
    idPrimario: null,
    tipologia: null,
    modalitaFormazione: null,
    riservatezza: null,
    identificativoFormato: null,
    verifica: null,
    registrazione: null,
    tracciatureModifiche: null,
  },
  aggregate: {
    tipoAggregazione: null,
    idAggregazione: null,
    tipoFascicolo: null,
    dataApertura: null,
    dataChiusura: null,
    procedimento: null,
    assegnazione: null,
  },
  subject: null,
  custom: null,
};

describe("DocumentRepository", () => {
  let dao: {
    getById: ReturnType<typeof vi.fn>;
    getByProcessId: ReturnType<typeof vi.fn>;
    getByStatus: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    updateIntegrityStatus: ReturnType<typeof vi.fn>;
    searchDocument: ReturnType<typeof vi.fn>;
    searchDocumentSemantic: ReturnType<typeof vi.fn>;
    getIndexedDocumentsCount: ReturnType<typeof vi.fn>;
  };
  let repo: DocumentRepository;

  const metadata = new Metadata("root", [], MetadataType.COMPOSITE);

  beforeEach(() => {
    dao = {
      getById: vi.fn(),
      getByProcessId: vi.fn(),
      getByStatus: vi.fn(),
      save: vi.fn(),
      updateIntegrityStatus: vi.fn(),
      searchDocument: vi.fn(),
      searchDocumentSemantic: vi.fn(),
      getIndexedDocumentsCount: vi.fn(),
    };

    repo = new DocumentRepository(dao as unknown as DocumentDAO);
  });

  it("save delega al DAO", () => {
    const input = new Document("doc-1", metadata, "proc-uuid");
    const saved = new Document(
      "doc-1",
      metadata,
      "proc-uuid",
      IntegrityStatusEnum.UNKNOWN,
      51,
      7,
    );
    dao.save.mockReturnValue(saved);

    const result = repo.save(input);

    expect(dao.save).toHaveBeenCalledWith(input);
    expect(result).toBe(saved);
  });

  it("getByProcessId, getByStatus e updateIntegrityStatus delegano al DAO", () => {
    const row = new Document(
      "doc-2",
      metadata,
      "proc-uuid",
      IntegrityStatusEnum.VALID,
      61,
      8,
    );
    dao.getByProcessId.mockReturnValue([row]);
    dao.getByStatus.mockReturnValue([row]);

    const byProcess = repo.getByProcessId(8);
    repo.updateIntegrityStatus(61, IntegrityStatusEnum.VALID);
    const byStatus = repo.getByStatus(IntegrityStatusEnum.VALID);

    expect(dao.getByProcessId).toHaveBeenCalledWith(8);
    expect(dao.updateIntegrityStatus).toHaveBeenCalledWith(
      61,
      IntegrityStatusEnum.VALID,
    );
    expect(dao.getByStatus).toHaveBeenCalledWith(IntegrityStatusEnum.VALID);
    expect(byProcess).toHaveLength(1);
    expect(byStatus[0].getUuid()).toBe("doc-2");
  });

  it("searchDocument delega al DAO con i filtri", () => {
    dao.searchDocument.mockReturnValue([]);

    const results = repo.searchDocument(emptyFilters);

    expect(dao.searchDocument).toHaveBeenCalledWith(emptyFilters);
    expect(results).toEqual([]);
  });

  it("searchDocumentSemantic delega al DAO", async () => {
    const semantic = [
      {
        document: new Document("doc-uuid", metadata, "proc-uuid"),
        score: 0.8,
      },
    ];
    dao.searchDocumentSemantic.mockResolvedValue(semantic);

    const result = await repo.searchDocumentSemantic("query test");

    expect(dao.searchDocumentSemantic).toHaveBeenCalledWith("query test");
    expect(result).toEqual(semantic);
  });

  it("getIndexedDocumentsCount delega al DAO", () => {
    dao.getIndexedDocumentsCount.mockReturnValue(42);

    const count = repo.getIndexedDocumentsCount();

    expect(dao.getIndexedDocumentsCount).toHaveBeenCalledTimes(1);
    expect(count).toBe(42);
  });

  it("getById delega al DAO", () => {
    const doc = new Document(
      "doc-uuid",
      metadata,
      "proc-uuid",
      IntegrityStatusEnum.UNKNOWN,
      10,
      2,
    );
    dao.getById.mockReturnValue(doc);

    const result = repo.getById(10);

    expect(dao.getById).toHaveBeenCalledWith(10);
    expect(result).toBe(doc);
  });
});
