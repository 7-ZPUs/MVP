import { describe, it, expect, vi } from "vitest";

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

import { IGetDocumentByIdPort } from "../../../src/repo/IDocumentRepository";
import { IWordEmbedding } from "../../../src/repo/IWordEmbedding";
import { ISearchSimilarVectorsPort } from "../../../src/repo/IVectorRepository";
import { SearchSemanticUC } from "../../../src/use-case/document/impl/SearchSemanticUC";
import { DocumentMapper } from "../../../src/dao/mappers/DocumentMapper";
import { MetadataType } from "../../../src/value-objects/Metadata";

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------

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

const makeAiAdapter = (vector: Float32Array): IWordEmbedding => ({
  generateEmbedding: vi.fn().mockResolvedValue(vector),
  isInitialized: vi.fn().mockReturnValue(true),
});

/**
 * Costruisce un mock di IVectorRepository che restituisce la lista
 * di { documentId, score } fornita.
 */
const makeVectorRepo = (
  results: { documentId: number; score: number }[],
): ISearchSimilarVectorsPort => ({
  searchSimilarVectors: vi.fn().mockResolvedValue(results),
});

/**
 * Costruisce un mock di IDocumentRepository il cui getById
 * risolve dall'array di documenti passato.
 * Usa il campo `id` del documento come chiave (non uuid).
 */
const makeDocumentRepo = (
  docs: ReturnType<typeof makeDocument>[],
): IGetDocumentByIdPort => ({
  getById: vi
    .fn()
    .mockImplementation(
      (id: number) => docs.find((d) => (d as any).id === id) ?? null,
    ),
});

// Istanzia il caso d'uso con i tre mock richiesti
const makeUC = (
  vectorResults: { documentId: number; score: number }[],
  documents: ReturnType<typeof makeDocument>[],
  vector = new Float32Array([0.1, 0.2, 0.3]),
) =>
  new SearchSemanticUC(
    makeDocumentRepo(documents),
    makeVectorRepo(vectorResults),
    makeAiAdapter(vector),
  );

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("SearchSemanticUC — calcolo score", () => {
  it("score è 1.0 quando la distanza è 0 (corrispondenza perfetta)", async () => {
    const doc = makeDocument("uuid-perfect", "esatto.pdf");
    (doc as any).id = 1;

    const uc = makeUC([{ documentId: 1, score: 1 }], [doc]);
    const results = await uc.execute("query esatta");

    expect(results[0].score).toBe(1);
  });

  it("score è 0.0 quando la distanza è massima (nessuna similarità)", async () => {
    const doc = makeDocument("uuid-none", "irrilevante.pdf");
    (doc as any).id = 1;

    const uc = makeUC([{ documentId: 1, score: 0 }], [doc]);
    const results = await uc.execute("query senza match");

    expect(results[0].score).toBe(0);
  });

  it("preserva l'ordine decrescente per score restituito dal repository", async () => {
    const docs = [1, 2, 3, 4].map((id) => {
      const d = makeDocument(`uuid-${id}`, `doc${id}.pdf`);
      (d as any).id = id;
      return d;
    });

    const vectorResults = [
      { documentId: 1, score: 0.95 },
      { documentId: 2, score: 0.8 },
      { documentId: 3, score: 0.65 },
      { documentId: 4, score: 0.4 },
    ];

    const uc = makeUC(vectorResults, docs);
    const results = await uc.execute("ordinamento");

    const scores = results.map((r) => r.score);
    for (let i = 0; i < scores.length - 1; i++) {
      expect(scores[i]).toBeGreaterThanOrEqual(scores[i + 1]);
    }
  });

  it("preserva la precisione decimale dello score", async () => {
    const doc = makeDocument("uuid-prec");
    (doc as any).id = 1;

    const uc = makeUC([{ documentId: 1, score: 0.123456789 }], [doc]);
    const results = await uc.execute("precisione");

    expect(results[0].score).toBeCloseTo(0.123456789, 9);
  });

  it("score nella fascia alta (> 0.8) indica alta rilevanza semantica", async () => {
    const doc = makeDocument("uuid-high", "rilevante.pdf");
    (doc as any).id = 1;

    const uc = makeUC([{ documentId: 1, score: 0.91 }], [doc]);
    const results = await uc.execute("documento rilevante");

    expect(results[0].score).toBeGreaterThan(0.8);
  });

  it("score nella fascia bassa (< 0.5) indica bassa rilevanza semantica", async () => {
    const doc = makeDocument("uuid-low", "irrilevante.pdf");
    (doc as any).id = 1;

    const uc = makeUC([{ documentId: 1, score: 0.32 }], [doc]);
    const results = await uc.execute("query distante");

    expect(results[0].score).toBeLessThan(0.5);
  });

  it("non restituisce più di 10 risultati (limite del repository)", async () => {
    const docs = Array.from({ length: 10 }, (_, i) => {
      const d = makeDocument(`uuid-${i}`, `doc${i}.pdf`);
      (d as any).id = i + 1;
      return d;
    });

    const vectorResults = docs.map((_, i) => ({
      documentId: i + 1,
      score: 1 - i * 0.05,
    }));

    const uc = makeUC(vectorResults, docs);
    const results = await uc.execute("top 10");

    expect(results.length).toBeLessThanOrEqual(10);
  });

  it("tutti gli score sono nel range valido [0.0, 1.0]", async () => {
    const docs = ["a", "b", "c"].map((suffix, i) => {
      const d = makeDocument(`uuid-${suffix}`);
      (d as any).id = i + 1;
      return d;
    });

    const vectorResults = [
      { documentId: 1, score: 0.99 },
      { documentId: 2, score: 0.5 },
      { documentId: 3, score: 0.01 },
    ];

    const uc = makeUC(vectorResults, docs);
    const results = await uc.execute("range check");

    results.forEach((r) => {
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(1);
    });
  });

  it("lancia un errore se il documentId restituito dal vectorRepo non esiste", async () => {
    const uc = makeUC([{ documentId: 999, score: 0.8 }], []);

    await expect(uc.execute("missing doc")).rejects.toThrow("999");
  });

  it("passa il vettore generato dall'adapter al vectorRepo", async () => {
    const vector = new Float32Array([0.5, 0.6, 0.7]);
    const doc = makeDocument("uuid-vec");
    (doc as any).id = 1;

    const aiAdapter = makeAiAdapter(vector);
    const vectorRepo = makeVectorRepo([{ documentId: 1, score: 0.9 }]);
    const documentRepo = makeDocumentRepo([doc]);

    const uc = new SearchSemanticUC(documentRepo, vectorRepo, aiAdapter);
    await uc.execute("test vettore");

    expect(aiAdapter.generateEmbedding).toHaveBeenCalledWith("test vettore");
    expect(vectorRepo.searchSimilarVectors).toHaveBeenCalledWith(vector, 10);
  });
});
