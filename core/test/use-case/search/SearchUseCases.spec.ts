import { describe, it, expect, vi, beforeEach } from "vitest";
import { SearchDocumentsUC } from "../../../src/use-case/document/impl/SearchDocumentsUC";
import { SearchSemanticUC } from "../../../src/use-case/document/impl/SearchSemanticUC";
import { IDocumentRepository } from "../../../src/repo/IDocumentRepository";
import { IWordEmbedding } from "../../../src/repo/IWordEmbedding";
import { SearchDocumentsQuery } from "../../../src/entity/search/SearchQuery.model";
import { DocumentMapper } from "../../../src/dao/mappers/DocumentMapper";
import { MetadataType } from "../../../src/value-objects/Metadata";

// Costruisce un Document già persistito con metadati opzionali
const makeDocument = (
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
      id: 1,
      uuid,
      integrityStatus: "UNKNOWN",
      processId: 1,
      processUuid: "proc-uuid",
    },
    rows,
  );
};

// Filtri vuoti — nessun campo attivo
const emptyFilters = new SearchDocumentsQuery({
  logicOperator: "AND",
  items: [],
});

// ─── SearchDocumentsUC ───────────────────────────────────────────────────────

describe("SearchDocumentsUC", () => {
  let repo: Pick<IDocumentRepository, "searchDocument">;

  beforeEach(() => {
    repo = { searchDocument: vi.fn() };
  });

  // Caso nominale: un documento con metadati completi
  it("mappa correttamente uuid, nome e tipoDocumento nel SearchResult", async () => {
    const doc = makeDocument("uuid-1", [
      { name: "nome", value: "fattura.pdf" },
      { name: "tipoDocumento", value: "DOCUMENTO INFORMATICO" },
    ]);
    (repo.searchDocument as ReturnType<typeof vi.fn>).mockReturnValue([doc]);

    const uc = new SearchDocumentsUC(repo as IDocumentRepository);
    const results = await uc.execute(emptyFilters);

    expect(results).toHaveLength(1);
    expect(results[0].getUuid()).toBe("uuid-1");
    expect(results[0].getMetadata().findNodeByName("nome")?.getStringValue()).toBe("fattura.pdf");
    expect(results[0].getMetadata().findNodeByName("tipoDocumento")?.getStringValue()).toBe("DOCUMENTO INFORMATICO");
  });

  // Il repo non trova documenti corrispondenti
  it("ritorna array vuoto se il repository non trova risultati", async () => {
    (repo.searchDocument as ReturnType<typeof vi.fn>).mockReturnValue([]);

    const uc = new SearchDocumentsUC(repo as IDocumentRepository);
    const results = await uc.execute(emptyFilters);

    expect(results).toHaveLength(0);
  });

  // Metadati assenti: i campi devono degradare a stringa vuota
  it("usa stringa vuota per name e type se i metadati sono assenti", async () => {
    const doc = makeDocument("uuid-2", []);
    (repo.searchDocument as ReturnType<typeof vi.fn>).mockReturnValue([doc]);

    const uc = new SearchDocumentsUC(repo as IDocumentRepository);
    const results = await uc.execute(emptyFilters);

    expect(results[0].getMetadata().findNodeByName("nome")).toBeNull();
    expect(results[0].getMetadata().findNodeByName("tipoDocumento")).toBeNull();
  });

  // I filtri devono essere passati intatti al repository
  it("passa i filtri al repository senza modificarli", async () => {
    (repo.searchDocument as ReturnType<typeof vi.fn>).mockReturnValue([]);

    const filters = new SearchDocumentsQuery({
      logicOperator: "AND",
      items: [
        { path: "tipoDocumento", operator: "EQ", value: "DOCUMENTO INFORMATICO" }
      ]
    });

    const uc = new SearchDocumentsUC(repo as IDocumentRepository);
    await uc.execute(filters);

    expect(repo.searchDocument).toHaveBeenCalledWith(filters);
  });

  // Più documenti: tutti devono essere mappati
  it("mappa correttamente più documenti restituiti dal repository", async () => {
    const docs = [
      makeDocument("uuid-a", [{ name: "nome", value: "a.pdf" }]),
      makeDocument("uuid-b", [{ name: "nome", value: "b.pdf" }]),
      makeDocument("uuid-c", [{ name: "nome", value: "c.pdf" }]),
    ];
    (repo.searchDocument as ReturnType<typeof vi.fn>).mockReturnValue(docs);

    const uc = new SearchDocumentsUC(repo as IDocumentRepository);
    const results = await uc.execute(emptyFilters);

    expect(results).toHaveLength(3);
    expect(results.map((r) => r.getUuid())).toEqual([
      "uuid-a",
      "uuid-b",
      "uuid-c",
    ]);
  });

  // Solo il metadato 'nome' deve essere usato per il campo name
  it("ignora metadati con chiavi diverse da nome e tipoDocumento", async () => {
    const doc = makeDocument("uuid-3", [
      { name: "autore", value: "Mario Rossi" },
      { name: "nome", value: "contratto.pdf" },
      { name: "tipoDocumento", value: "DOCUMENTO AMMINISTRATIVO INFORMATICO" },
      { name: "classificazione", value: "1.2.3" },
    ]);
    (repo.searchDocument as ReturnType<typeof vi.fn>).mockReturnValue([doc]);

    const uc = new SearchDocumentsUC(repo as IDocumentRepository);
    const results = await uc.execute(emptyFilters);

    expect(results[0].getMetadata().findNodeByName("nome")?.getStringValue()).toBe("contratto.pdf");
    expect(results[0].getMetadata().findNodeByName("tipoDocumento")?.getStringValue()).toBe("DOCUMENTO AMMINISTRATIVO INFORMATICO");
  });

  it("usa il primo metadato corrispondente quando ci sono duplicati (nome/tipoDocumento)", async () => {
    const doc = makeDocument("uuid-dup-normal", [
      { name: "nome", value: "primo-nome.pdf" },
      { name: "nome", value: "secondo-nome.pdf" },
      { name: "tipoDocumento", value: "TIPO-1" },
      { name: "tipoDocumento", value: "TIPO-2" },
    ]);
    (repo.searchDocument as ReturnType<typeof vi.fn>).mockReturnValue([doc]);

    const uc = new SearchDocumentsUC(repo as IDocumentRepository);
    const results = await uc.execute(emptyFilters);

    expect(results[0].getMetadata().findNodeByName("nome")?.getStringValue()).toBe("primo-nome.pdf");
    expect(results[0].getMetadata().findNodeByName("tipoDocumento")?.getStringValue()).toBe("TIPO-1");
  });

  it("propaga errori del repository durante la ricerca normale", async () => {
    (repo.searchDocument as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error("db unavailable");
    });

    const uc = new SearchDocumentsUC(repo as IDocumentRepository);

    await expect(uc.execute(emptyFilters)).rejects.toThrow("db unavailable");
  });
});

// ─── SearchSemanticUC ────────────────────────────────────────────────────────

describe("SearchSemanticUC", () => {
  let repo: Pick<IDocumentRepository, "searchDocumentSemantic">;
  let aiAdapter: IWordEmbedding;
  let embedding: Float32Array;

  beforeEach(() => {
    repo = { searchDocumentSemantic: vi.fn() };
    embedding = new Float32Array([0.11, 0.22, 0.33]);
    aiAdapter = {
      generateEmbedding: vi.fn().mockResolvedValue(embedding),
      isInitialized: vi.fn().mockReturnValue(true),
    };
  });

  // Caso nominale: un documento con score alto
  it("mappa correttamente uuid, nome, tipo e score nel SearchResult", async () => {
    const doc = makeDocument("uuid-s1", [
      { name: "nome", value: "contratto.pdf" },
      { name: "tipoDocumento", value: "DOCUMENTO AMMINISTRATIVO INFORMATICO" },
    ]);
    (repo.searchDocumentSemantic as ReturnType<typeof vi.fn>).mockResolvedValue(
      [{ document: doc, score: 0.92 }],
    );

    const uc = new SearchSemanticUC(repo as IDocumentRepository, aiAdapter);
    const results = await uc.execute("contratto");

    expect(results).toHaveLength(1);
    expect(results[0].documentId).toBe("uuid-s1");
    expect(results[0].name).toBe("contratto.pdf");
    expect(results[0].type).toBe("DOCUMENTO AMMINISTRATIVO INFORMATICO");
    expect(results[0].score).toBe(0.92);
  });

  // Score deve essere un numero reale, mai null
  it("lo score semantico è sempre un numero, mai null", async () => {
    const doc = makeDocument("uuid-s2", []);
    (repo.searchDocumentSemantic as ReturnType<typeof vi.fn>).mockResolvedValue(
      [{ document: doc, score: 0.75 }],
    );

    const uc = new SearchSemanticUC(repo as IDocumentRepository, aiAdapter);
    const results = await uc.execute("query");

    expect(typeof results[0].score).toBe("number");
    expect(results[0].score).not.toBeNull();
  });

  // Nessun documento simile trovato
  it("ritorna array vuoto se nessun documento supera la soglia di similarità", async () => {
    (repo.searchDocumentSemantic as ReturnType<typeof vi.fn>).mockResolvedValue(
      [],
    );

    const uc = new SearchSemanticUC(repo as IDocumentRepository, aiAdapter);
    const results = await uc.execute("query senza risultati");

    expect(results).toHaveLength(0);
  });

  // La query deve essere passata all'embedder e il vettore al repository
  it("genera embedding dalla query e passa il vettore al repository", async () => {
    (repo.searchDocumentSemantic as ReturnType<typeof vi.fn>).mockResolvedValue(
      [],
    );

    const uc = new SearchSemanticUC(repo as IDocumentRepository, aiAdapter);
    await uc.execute("ricerca semantica avanzata");

    expect(aiAdapter.generateEmbedding).toHaveBeenCalledWith(
      "ricerca semantica avanzata",
    );
    expect(repo.searchDocumentSemantic).toHaveBeenCalledWith(embedding);
  });

  // Più risultati ordinati per score decrescente
  it("preserva l'ordine dei risultati restituito dal repository", async () => {
    const docs = [
      {
        document: makeDocument("uuid-high", [
          { name: "nome", value: "alto.pdf" },
        ]),
        score: 0.95,
      },
      {
        document: makeDocument("uuid-mid", [
          { name: "nome", value: "medio.pdf" },
        ]),
        score: 0.78,
      },
      {
        document: makeDocument("uuid-low", [
          { name: "nome", value: "basso.pdf" },
        ]),
        score: 0.61,
      },
    ];
    (repo.searchDocumentSemantic as ReturnType<typeof vi.fn>).mockResolvedValue(
      docs,
    );

    const uc = new SearchSemanticUC(repo as IDocumentRepository, aiAdapter);
    const results = await uc.execute("test ordine");

    expect(results[0].score).toBe(0.95);
    expect(results[1].score).toBe(0.78);
    expect(results[2].score).toBe(0.61);
  });

  // Score al limite: 0.0 e 1.0 sono valori validi
  it("gestisce correttamente score ai valori limite (0.0 e 1.0)", async () => {
    const docs = [
      { document: makeDocument("uuid-max", []), score: 1 },
      { document: makeDocument("uuid-min", []), score: 0 },
    ];
    (repo.searchDocumentSemantic as ReturnType<typeof vi.fn>).mockResolvedValue(
      docs,
    );

    const uc = new SearchSemanticUC(repo as IDocumentRepository, aiAdapter);
    const results = await uc.execute("limiti");

    expect(results[0].score).toBe(1);
    expect(results[1].score).toBe(0);
  });

  // Metadati assenti nella ricerca semantica
  it("usa stringa vuota per name e type se i metadati sono assenti", async () => {
    const doc = makeDocument("uuid-empty", []);
    (repo.searchDocumentSemantic as ReturnType<typeof vi.fn>).mockResolvedValue(
      [{ document: doc, score: 0.88 }],
    );

    const uc = new SearchSemanticUC(repo as IDocumentRepository, aiAdapter);
    const results = await uc.execute("senza metadati");

    expect(results[0].name).toBe("");
    expect(results[0].type).toBe("");
    expect(results[0].score).toBe(0.88);
  });

  it("usa il primo metadato corrispondente quando ci sono duplicati", async () => {
    const doc = makeDocument("uuid-dup", [
      { name: "nome", value: "primo.pdf" },
      { name: "nome", value: "secondo.pdf" },
      { name: "tipoDocumento", value: "TIPO-1" },
      { name: "tipoDocumento", value: "TIPO-2" },
    ]);
    (repo.searchDocumentSemantic as ReturnType<typeof vi.fn>).mockResolvedValue(
      [{ document: doc, score: 0.5 }],
    );

    const uc = new SearchSemanticUC(repo as IDocumentRepository, aiAdapter);
    const results = await uc.execute("duplicati");

    expect(results[0].name).toBe("primo.pdf");
    expect(results[0].type).toBe("TIPO-1");
  });

  it("propaga errori del repository durante la ricerca semantica", async () => {
    (repo.searchDocumentSemantic as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("semantic fail"),
    );

    const uc = new SearchSemanticUC(repo as IDocumentRepository, aiAdapter);

    await expect(uc.execute("query")).rejects.toThrow("semantic fail");
  });
});
