import { describe, it, expect, vi, beforeEach } from "vitest";
import { SearchDocumentsUC } from "../../../src/use-case/document/impl/SearchDocumentsUC";
import { SearchSemanticUC } from "../../../src/use-case/document/impl/SearchSemanticUC";
import {
  IGetDocumentByIdPort,
  ISearchDocumentPort,
} from "../../../src/repo/IDocumentRepository";
import { ISearchSimilarVectorsPort } from "../../../src/repo/IVectorRepository";
import { IWordEmbedding } from "../../../src/repo/IWordEmbedding";
import { IVectorRepository } from "../../../src/repo/IVectorRepository";
import { SearchDocumentsQuery } from "../../../src/entity/search/SearchQuery.model";
import { DocumentMapper } from "../../../src/dao/mappers/DocumentMapper";
import { MetadataType } from "../../../src/value-objects/Metadata";

const makeDocument = (
  id: number,
  uuid: string,
  metadata: { name: string; value: string }[] = [],
) => {
  const rows = [
    {
      id: 1,
      parent_id: null,
      name: "root",
      value: "",
      type: MetadataType.COMPOSITE,
    },
    ...metadata.map((m, idx) => ({
      id: idx + 2,
      parent_id: 1,
      name: m.name,
      value: m.value,
      type: MetadataType.STRING,
    })),
  ];

  return DocumentMapper.fromPersistence(
    {
      id,
      uuid,
      integrityStatus: "UNKNOWN",
      processId: 1,
      processUuid: "proc-uuid",
    },
    rows,
  );
};

const emptyFilters = new SearchDocumentsQuery({
  logicOperator: "AND",
  items: [],
});

// ─── SearchDocumentsUC ───────────────────────────────────────────────────────

describe("SearchDocumentsUC", () => {
  let repo: ISearchDocumentPort;

  beforeEach(() => {
    repo = { searchDocument: vi.fn() };
  });

  it("mappa correttamente uuid, nome e tipoDocumento nel SearchResult", async () => {
    const doc = makeDocument(1, "uuid-1", [
      { name: "NomeDelDocumento", value: "fattura.pdf" },
      { name: "tipoDocumento", value: "DOCUMENTO INFORMATICO" },
    ]);
    (repo.searchDocument as ReturnType<typeof vi.fn>).mockReturnValue([doc]);

    const uc = new SearchDocumentsUC(repo);
    const results = await uc.execute(emptyFilters);

    expect(results).toHaveLength(1);
    expect(results[0].getUuid()).toBe("uuid-1");
    expect(
      results[0].getMetadata().findNodeByName("NomeDelDocumento")?.getStringValue(),
    ).toBe("fattura.pdf");
    expect(
      results[0].getMetadata().findNodeByName("tipoDocumento")?.getStringValue(),
    ).toBe("DOCUMENTO INFORMATICO");
  });

  it("ritorna array vuoto se il repository non trova risultati", async () => {
    (repo.searchDocument as ReturnType<typeof vi.fn>).mockReturnValue([]);

    const uc = new SearchDocumentsUC(repo);
    const results = await uc.execute(emptyFilters);

    expect(results).toHaveLength(0);
  });

  it("usa stringa vuota per name e type se i metadati sono assenti", async () => {
    const doc = makeDocument(2, "uuid-2", []);
    (repo.searchDocument as ReturnType<typeof vi.fn>).mockReturnValue([doc]);

    const uc = new SearchDocumentsUC(repo);
    const results = await uc.execute(emptyFilters);

    expect(results[0].getMetadata().findNodeByName("nome")).toBeNull();
    expect(results[0].getMetadata().findNodeByName("tipoDocumento")).toBeNull();
  });

  it("passa i filtri al repository senza modificarli", async () => {
    (repo.searchDocument as ReturnType<typeof vi.fn>).mockReturnValue([]);

    const filters = new SearchDocumentsQuery({
      logicOperator: "AND",
      items: [
        { path: "tipoDocumento", operator: "EQ", value: "DOCUMENTO INFORMATICO" },
      ],
    });

    const uc = new SearchDocumentsUC(repo);
    await uc.execute(filters);

    expect(repo.searchDocument).toHaveBeenCalledWith(filters);
  });

  it("mappa correttamente più documenti restituiti dal repository", async () => {
    const docs = [
      makeDocument(11, "uuid-a", [{ name: "NomeDelDocumento", value: "a.pdf" }]),
      makeDocument(12, "uuid-b", [{ name: "NomeDelDocumento", value: "b.pdf" }]),
      makeDocument(13, "uuid-c", [{ name: "NomeDelDocumento", value: "c.pdf" }]),
    ];
    (repo.searchDocument as ReturnType<typeof vi.fn>).mockReturnValue(docs);

    const uc = new SearchDocumentsUC(repo);
    const results = await uc.execute(emptyFilters);

    expect(results).toHaveLength(3);
    expect(results.map((r) => r.getUuid())).toEqual(["uuid-a", "uuid-b", "uuid-c"]);
  });

  it("ignora metadati con chiavi diverse da nome e tipoDocumento", async () => {
    const doc = makeDocument(3, "uuid-3", [
      { name: "autore", value: "Mario Rossi" },
      { name: "NomeDelDocumento", value: "contratto.pdf" },
      { name: "tipoDocumento", value: "DOCUMENTO AMMINISTRATIVO INFORMATICO" },
      { name: "classificazione", value: "1.2.3" },
    ]);
    (repo.searchDocument as ReturnType<typeof vi.fn>).mockReturnValue([doc]);

    const uc = new SearchDocumentsUC(repo);
    const results = await uc.execute(emptyFilters);

    expect(
      results[0].getMetadata().findNodeByName("NomeDelDocumento")?.getStringValue(),
    ).toBe("contratto.pdf");
    expect(
      results[0].getMetadata().findNodeByName("tipoDocumento")?.getStringValue(),
    ).toBe("DOCUMENTO AMMINISTRATIVO INFORMATICO");
  });

  it("usa il primo metadato corrispondente quando ci sono duplicati (nome/tipoDocumento)", async () => {
    const doc = makeDocument(4, "uuid-dup-normal", [
      { name: "NomeDelDocumento", value: "primo-nome.pdf" },
      { name: "NomeDelDocumento", value: "secondo-nome.pdf" },
      { name: "tipoDocumento", value: "TIPO-1" },
      { name: "tipoDocumento", value: "TIPO-2" },
    ]);
    (repo.searchDocument as ReturnType<typeof vi.fn>).mockReturnValue([doc]);

    const uc = new SearchDocumentsUC(repo);
    const results = await uc.execute(emptyFilters);

    expect(
      results[0].getMetadata().findNodeByName("NomeDelDocumento")?.getStringValue(),
    ).toBe("primo-nome.pdf");
    expect(
      results[0].getMetadata().findNodeByName("tipoDocumento")?.getStringValue(),
    ).toBe("TIPO-1");
  });

  it("propaga errori del repository durante la ricerca normale", async () => {
    (repo.searchDocument as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error("db unavailable");
    });

    const uc = new SearchDocumentsUC(repo);

    expect(() => uc.execute(emptyFilters)).toThrow("db unavailable");
  });
});

// ─── SearchSemanticUC ────────────────────────────────────────────────────────

describe("SearchSemanticUC", () => {
  let documentRepo: Pick<IDocumentRepository, "getById">;
  let vectorRepo: Pick<IVectorRepository, "searchSimilarVectors">;
  let aiAdapter: IWordEmbedding;
  let embedding: Float32Array;

  beforeEach(() => {
    embedding = new Float32Array([0.11, 0.22, 0.33]);
    aiAdapter = {
      generateEmbedding: vi.fn().mockResolvedValue(embedding),
      isInitialized: vi.fn().mockReturnValue(true),
    };
    vectorRepo = { searchSimilarVectors: vi.fn() };
    documentRepo = { getById: vi.fn() };
  });

  it("ritorna coppie documento+score dal repository", async () => {
    const doc = makeDocument(21, "uuid-s1", [
      { name: "nome", value: "contratto.pdf" },
      { name: "tipoDocumento", value: "DOCUMENTO AMMINISTRATIVO INFORMATICO" },
    ]);
    (vectorRepo.searchSimilarVectors as ReturnType<typeof vi.fn>).mockResolvedValue([
      { documentId: 21, score: 0.92 },
    ]);
    (documentRepo.getById as ReturnType<typeof vi.fn>).mockReturnValue(doc);

    const uc = new SearchSemanticUC(
      documentRepo as IDocumentRepository,
      vectorRepo as IVectorRepository,
      aiAdapter,
    );
    const results = await uc.execute("contratto");

    expect(results).toHaveLength(1);
    expect(results[0].document.getUuid()).toBe("uuid-s1");
    expect(results[0].score).toBe(0.92);
  });

  it("lo score semantico è sempre un numero, mai null", async () => {
    const doc = makeDocument(22, "uuid-s2", []);
    (vectorRepo.searchSimilarVectors as ReturnType<typeof vi.fn>).mockResolvedValue([
      { documentId: 22, score: 0.75 },
    ]);
    (documentRepo.getById as ReturnType<typeof vi.fn>).mockReturnValue(doc);

    const uc = new SearchSemanticUC(
      documentRepo as IDocumentRepository,
      vectorRepo as IVectorRepository,
      aiAdapter,
    );
    const results = await uc.execute("query");

    expect(typeof results[0].score).toBe("number");
    expect(results[0].score).not.toBeNull();
  });

  it("ritorna array vuoto se nessun documento supera la soglia di similarità", async () => {
    (vectorRepo.searchSimilarVectors as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const uc = new SearchSemanticUC(
      documentRepo as IDocumentRepository,
      vectorRepo as IVectorRepository,
      aiAdapter,
    );
    const results = await uc.execute("query senza risultati");

    expect(results).toHaveLength(0);
  });

  it("genera embedding dalla query e passa il vettore al repository", async () => {
    (vectorRepo.searchSimilarVectors as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const uc = new SearchSemanticUC(
      documentRepo as IDocumentRepository,
      vectorRepo as IVectorRepository,
      aiAdapter,
    );
    await uc.execute("ricerca semantica avanzata");

    expect(aiAdapter.generateEmbedding).toHaveBeenCalledWith("ricerca semantica avanzata");
    expect(vectorRepo.searchSimilarVectors).toHaveBeenCalledWith(embedding, 10);
  });

  it("preserva l'ordine dei risultati restituito dal repository", async () => {
    const docHigh = makeDocument(31, "uuid-high", [{ name: "nome", value: "alto.pdf" }]);
    const docMid  = makeDocument(32, "uuid-mid",  [{ name: "nome", value: "medio.pdf" }]);
    const docLow  = makeDocument(33, "uuid-low",  [{ name: "nome", value: "basso.pdf" }]);

    (vectorRepo.searchSimilarVectors as ReturnType<typeof vi.fn>).mockResolvedValue([
      { documentId: 31, score: 0.95 },
      { documentId: 32, score: 0.78 },
      { documentId: 33, score: 0.61 },
    ]);
    (documentRepo.getById as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(docHigh)
      .mockReturnValueOnce(docMid)
      .mockReturnValueOnce(docLow);

    const uc = new SearchSemanticUC(
      documentRepo as IDocumentRepository,
      vectorRepo as IVectorRepository,
      aiAdapter,
    );
    const results = await uc.execute("test ordine");

    expect(results[0].score).toBe(0.95);
    expect(results[1].score).toBe(0.78);
    expect(results[2].score).toBe(0.61);
  });

  it("gestisce correttamente score ai valori limite (0.0 e 1.0)", async () => {
    const docMax = makeDocument(41, "uuid-max", []);
    const docMin = makeDocument(42, "uuid-min", []);

    (vectorRepo.searchSimilarVectors as ReturnType<typeof vi.fn>).mockResolvedValue([
      { documentId: 41, score: 1 },
      { documentId: 42, score: 0 },
    ]);
    (documentRepo.getById as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(docMax)
      .mockReturnValueOnce(docMin);

    const uc = new SearchSemanticUC(
      documentRepo as IDocumentRepository,
      vectorRepo as IVectorRepository,
      aiAdapter,
    );
    const results = await uc.execute("limiti");

    expect(results[0].score).toBe(1);
    expect(results[1].score).toBe(0);
  });

  it("ritorna comunque documento e score anche con metadati assenti", async () => {
    const doc = makeDocument(43, "uuid-empty", []);
    (vectorRepo.searchSimilarVectors as ReturnType<typeof vi.fn>).mockResolvedValue([
      { documentId: 43, score: 0.88 },
    ]);
    (documentRepo.getById as ReturnType<typeof vi.fn>).mockReturnValue(doc);

    const uc = new SearchSemanticUC(
      documentRepo as IDocumentRepository,
      vectorRepo as IVectorRepository,
      aiAdapter,
    );
    const results = await uc.execute("senza metadati");

    expect(results[0].document.getUuid()).toBe("uuid-empty");
    expect(results[0].score).toBe(0.88);
  });

  it("preserva il documento originale anche con metadati duplicati", async () => {
    const doc = makeDocument(44, "uuid-dup", [
      { name: "nome", value: "primo.pdf" },
      { name: "nome", value: "secondo.pdf" },
      { name: "tipoDocumento", value: "TIPO-1" },
      { name: "tipoDocumento", value: "TIPO-2" },
    ]);
    (vectorRepo.searchSimilarVectors as ReturnType<typeof vi.fn>).mockResolvedValue([
      { documentId: 44, score: 0.5 },
    ]);
    (documentRepo.getById as ReturnType<typeof vi.fn>).mockReturnValue(doc);

    const uc = new SearchSemanticUC(
      documentRepo as IDocumentRepository,
      vectorRepo as IVectorRepository,
      aiAdapter,
    );
    const results = await uc.execute("duplicati");

    expect(results[0].document.getUuid()).toBe("uuid-dup");
    expect(results[0].score).toBe(0.5);
  });

  it("propaga errori del repository durante la ricerca semantica", async () => {
    (vectorRepo.searchSimilarVectors as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("semantic fail"),
    );

    const uc = new SearchSemanticUC(
      documentRepo as IDocumentRepository,
      vectorRepo as IVectorRepository,
      aiAdapter,
    );

    await expect(uc.execute("query")).rejects.toThrow("semantic fail");
  });
});