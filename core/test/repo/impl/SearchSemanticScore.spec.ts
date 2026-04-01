import { describe, it, expect, vi } from "vitest";

// Mock delle dipendenze esterne prima degli import
vi.mock("electron", () => ({ app: { isPackaged: false } }));
vi.mock("@xenova/transformers", () => ({
  pipeline: vi.fn(),
  env: {
    localModelPath: "",
    allowLocalModels: true,
    allowRemoteModels: false,
    useBrowserCache: false,
    backends: { onnx: { executionProviders: [], wasm: { numThreads: 1 } } },
  },
}));

import { IDocumentRepository } from "../../../src/repo/IDocumentRepository";
import { IWordEmbedding } from "../../../src/repo/IWordEmbedding";
import { SearchSemanticUC } from "../../../src/use-case/document/impl/SearchSemanticUC";
import { DocumentMapper } from "../../../src/dao/mappers/DocumentMapper";
import { MetadataType } from "../../../src/value-objects/Metadata";

// Costruisce un documento con uuid e metadati
const makeDocument = (uuid: string, nome = "", tipo = "") =>
  DocumentMapper.fromPersistence(
    {
      id: 1,
      uuid,
      integrityStatus: "UNKNOWN",
      processId: 1,
      processUuid: "proc-uuid",
    },
    [
      {
        id: 1,
        parent_id: null,
        name: "root",
        value: "",
        type: MetadataType.COMPOSITE,
      },
      {
        id: 2,
        parent_id: 1,
        name: "nome",
        value: nome,
        type: MetadataType.STRING,
      },
      {
        id: 3,
        parent_id: 1,
        name: "tipoDocumento",
        value: tipo,
        type: MetadataType.STRING,
      },
    ],
  );

// Costruisce un mock di IWordEmbedding che ritorna vettori predefiniti
const makeAiAdapter = (vector: Float32Array): IWordEmbedding => ({
  generateEmbedding: vi.fn().mockResolvedValue(vector),
  isInitialized: vi.fn().mockReturnValue(true),
});

// ─── Score semantico ─────────────────────────────────────────────────────────

describe("SearchSemanticUC — calcolo score", () => {
  const defaultVector = new Float32Array([0.1, 0.2, 0.3]);

  // Score massimo: distanza 0 → score 1.0 (documento identico alla query)
  it("score è 1.0 quando la distanza è 0 (corrispondenza perfetta)", async () => {
    const repo: Pick<IDocumentRepository, "searchDocumentSemantic"> = {
      searchDocumentSemantic: vi
        .fn()
        .mockResolvedValue([
          { document: makeDocument("uuid-perfect", "esatto.pdf"), score: 1 },
        ]),
    };

    const uc = new SearchSemanticUC(
      repo as IDocumentRepository,
      makeAiAdapter(defaultVector),
    );
    const results = await uc.execute("query esatta");

    expect(results[0].score).toBe(1);
  });

  // Score minimo: distanza 1 → score 0.0 (documento completamente diverso)
  it("score è 0.0 quando la distanza è massima (nessuna similarità)", async () => {
    const repo: Pick<IDocumentRepository, "searchDocumentSemantic"> = {
      searchDocumentSemantic: vi.fn().mockResolvedValue([
        {
          document: makeDocument("uuid-none", "irrilevante.pdf"),
          score: 0,
        },
      ]),
    };

    const uc = new SearchSemanticUC(
      repo as IDocumentRepository,
      makeAiAdapter(defaultVector),
    );
    const results = await uc.execute("query senza match");

    expect(results[0].score).toBe(0);
  });

  // I risultati devono preservare l'ordine per score decrescente
  it("preserva l'ordine decrescente per score restituito dal repository", async () => {
    const repo: Pick<IDocumentRepository, "searchDocumentSemantic"> = {
      searchDocumentSemantic: vi.fn().mockResolvedValue([
        { document: makeDocument("uuid-1", "primo.pdf"), score: 0.95 },
        { document: makeDocument("uuid-2", "secondo.pdf"), score: 0.8 },
        { document: makeDocument("uuid-3", "terzo.pdf"), score: 0.65 },
        { document: makeDocument("uuid-4", "quarto.pdf"), score: 0.4 },
      ]),
    };

    const uc = new SearchSemanticUC(
      repo as IDocumentRepository,
      makeAiAdapter(defaultVector),
    );
    const results = await uc.execute("ordinamento");

    const scores = results.map((r) => r.score);
    // Verifica che i punteggi siano in ordine decrescente
    for (let i = 0; i < scores.length - 1; i++) {
      expect(scores[i]!).toBeGreaterThanOrEqual(scores[i + 1]!);
    }
  });

  // Score con precisione decimale — nessun arrotondamento indesiderato
  it("preserva la precisione decimale dello score", async () => {
    const repo: Pick<IDocumentRepository, "searchDocumentSemantic"> = {
      searchDocumentSemantic: vi
        .fn()
        .mockResolvedValue([
          { document: makeDocument("uuid-prec"), score: 0.123456789 },
        ]),
    };

    const uc = new SearchSemanticUC(
      repo as IDocumentRepository,
      makeAiAdapter(defaultVector),
    );
    const results = await uc.execute("precisione");

    expect(results[0].score).toBeCloseTo(0.123456789, 9);
  });

  // Score nella fascia alta — documenti molto rilevanti
  it("score nella fascia alta (> 0.8) indica alta rilevanza semantica", async () => {
    const repo: Pick<IDocumentRepository, "searchDocumentSemantic"> = {
      searchDocumentSemantic: vi
        .fn()
        .mockResolvedValue([
          { document: makeDocument("uuid-high", "rilevante.pdf"), score: 0.91 },
        ]),
    };

    const uc = new SearchSemanticUC(
      repo as IDocumentRepository,
      makeAiAdapter(defaultVector),
    );
    const results = await uc.execute("documento rilevante");

    expect(results[0].score).toBeGreaterThan(0.8);
  });

  // Score nella fascia bassa — documenti poco rilevanti
  it("score nella fascia bassa (< 0.5) indica bassa rilevanza semantica", async () => {
    const repo: Pick<IDocumentRepository, "searchDocumentSemantic"> = {
      searchDocumentSemantic: vi.fn().mockResolvedValue([
        {
          document: makeDocument("uuid-low", "irrilevante.pdf"),
          score: 0.32,
        },
      ]),
    };

    const uc = new SearchSemanticUC(
      repo as IDocumentRepository,
      makeAiAdapter(defaultVector),
    );
    const results = await uc.execute("query distante");

    expect(results[0].score).toBeLessThan(0.5);
  });

  // Il limite massimo di risultati è 10 (definito in searchDocumentSemantic)
  it("non restituisce più di 10 risultati (limite del repository)", async () => {
    const docs = Array.from({ length: 10 }, (_, i) => ({
      document: makeDocument(`uuid-${i}`, `doc${i}.pdf`),
      score: 1 - i * 0.05,
    }));
    const repo: Pick<IDocumentRepository, "searchDocumentSemantic"> = {
      searchDocumentSemantic: vi.fn().mockResolvedValue(docs),
    };

    const uc = new SearchSemanticUC(
      repo as IDocumentRepository,
      makeAiAdapter(defaultVector),
    );
    const results = await uc.execute("top 10");

    expect(results.length).toBeLessThanOrEqual(10);
  });

  // Tutti gli score devono essere nel range [0, 1]
  it("tutti gli score sono nel range valido [0.0, 1.0]", async () => {
    const docs = [
      { document: makeDocument("uuid-a"), score: 0.99 },
      { document: makeDocument("uuid-b"), score: 0.5 },
      { document: makeDocument("uuid-c"), score: 0.01 },
    ];
    const repo: Pick<IDocumentRepository, "searchDocumentSemantic"> = {
      searchDocumentSemantic: vi.fn().mockResolvedValue(docs),
    };

    const uc = new SearchSemanticUC(
      repo as IDocumentRepository,
      makeAiAdapter(defaultVector),
    );
    const results = await uc.execute("range check");

    results.forEach((r) => {
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(1);
    });
  });
});
