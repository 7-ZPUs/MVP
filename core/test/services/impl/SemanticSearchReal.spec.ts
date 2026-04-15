import { vi, describe, it, expect, beforeAll } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

// ─── Skip in CI ───────────────────────────────────────────────────────────────
const isCI = process.env.CI === "true";
const modelsPath = path.join(process.cwd(), "core", "src", "models", "Xenova");
const modelFile = path.join(
  modelsPath,
  "paraphrase-multilingual-MiniLM-L12-v2",
  "onnx",
  "model_quantized.onnx",
);
const modelExists = fs.existsSync(modelFile);

const describeIfLocal = isCI || !modelExists ? describe.skip : describe;

// ─── Setup modello reale ──────────────────────────────────────────────────────

let adapter: any;

beforeAll(async () => {
  if (isCI || !modelExists) return;

  vi.mock("electron", () => ({ app: { isPackaged: false } }));

  const mod = await import("../../../src/repo/impl/WordEmbedding");
  adapter = new mod.WordEmbedding();
  await adapter.initialize();
}, 30_000);

// ─── Helper: calcolo coseno ───────────────────────────────────────────────────

const cosineSimilarity = (a: Float32Array, b: Float32Array): number => {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

// ─── Test generazione embedding ───────────────────────────────────────────────

describeIfLocal("WordEmbedding reale — generazione embedding", () => {
  it("genera un Float32Array di 384 dimensioni", async () => {
    const result = await adapter.generateEmbedding("documento contratto");
    expect(result).toBeInstanceOf(Float32Array);
    expect(result.length).toBe(384);
  }, 10_000);

  it("il vettore è normalizzato — norma ≈ 1.0", async () => {
    const result = await adapter.generateEmbedding("testo di prova");
    const norm = Math.sqrt(
      (Array.from(result) as number[]).reduce((sum, v) => sum + v * v, 0),
    );
    expect(norm).toBeCloseTo(1, 2);
  }, 10_000);

  it("tutti i valori del vettore sono nel range [-1, 1]", async () => {
    const result = await adapter.generateEmbedding("test range valori");
    Array.from(result).forEach((v) => {
      expect(v).toBeGreaterThanOrEqual(-1);
      expect(v).toBeLessThanOrEqual(1);
    });
  }, 10_000);

  it("testi diversi producono vettori diversi", async () => {
    const v1 = await adapter.generateEmbedding("contratto di vendita");
    const v2 = await adapter.generateEmbedding("verbale di assemblea");
    let areDifferent = false;
    for (let i = 0; i < v1.length; i++) {
      if (Math.abs(v1[i] - v2[i]) > 0.001) { areDifferent = true; break; }
    }
    expect(areDifferent).toBe(true);
  }, 10_000);

  it("lo stesso testo produce sempre lo stesso vettore", async () => {
    const text = "documento informatico";
    const v1 = await adapter.generateEmbedding(text);
    const v2 = await adapter.generateEmbedding(text);
    for (let i = 0; i < v1.length; i++) expect(v1[i]).toBeCloseTo(v2[i], 5);
  }, 10_000);
});

// ─── Test similarità semantica ────────────────────────────────────────────────

describeIfLocal("WordEmbedding reale — similarità semantica", () => {
  it("frasi semanticamente simili hanno similarità > 0.7", async () => {
    const v1 = await adapter.generateEmbedding("contratto di compravendita immobile");
    const v2 = await adapter.generateEmbedding("accordo per la vendita di un immobile");
    expect(cosineSimilarity(v1, v2)).toBeGreaterThan(0.7);
  }, 15_000);

  it("frasi semanticamente diverse hanno similarità < 0.5", async () => {
    const v1 = await adapter.generateEmbedding("contratto di compravendita immobile");
    const v2 = await adapter.generateEmbedding("ricetta della pizza margherita");
    expect(cosineSimilarity(v1, v2)).toBeLessThan(0.5);
  }, 15_000);

  it("la stessa frase ha similarità = 1.0 con se stessa", async () => {
    const v = await adapter.generateEmbedding("documento amministrativo informatico");
    expect(cosineSimilarity(v, v)).toBeCloseTo(1, 4);
  }, 10_000);

  it("frasi in italiano simili hanno similarità alta", async () => {
    const v1 = await adapter.generateEmbedding("verbale di riunione del consiglio");
    const v2 = await adapter.generateEmbedding("resoconto della seduta del consiglio");
    expect(cosineSimilarity(v1, v2)).toBeGreaterThan(0.75);
  }, 15_000);

  it("documenti amministrativi simili hanno similarità > 0.7", async () => {
    const v1 = await adapter.generateEmbedding("delibera di giunta comunale");
    const v2 = await adapter.generateEmbedding("deliberazione della giunta municipale");
    expect(cosineSimilarity(v1, v2)).toBeGreaterThan(0.7);
  }, 15_000);

  it("la similarità è simmetrica — sim(a,b) = sim(b,a)", async () => {
    const v1 = await adapter.generateEmbedding("atto notarile");
    const v2 = await adapter.generateEmbedding("documento notarile");
    expect(cosineSimilarity(v1, v2)).toBeCloseTo(cosineSimilarity(v2, v1), 5);
  }, 15_000);

  it("testo multilingua — italiano e inglese simili hanno similarità > 0.6", async () => {
    const v1 = await adapter.generateEmbedding("contratto di lavoro");
    const v2 = await adapter.generateEmbedding("employment contract");
    expect(cosineSimilarity(v1, v2)).toBeGreaterThan(0.6);
  }, 15_000);

  it("score come 1 - distanza è nel range [0, 1]", async () => {
    const v1 = await adapter.generateEmbedding("fattura elettronica");
    const v2 = await adapter.generateEmbedding("documento fiscale elettronico");
    const score = cosineSimilarity(v1, v2);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  }, 15_000);
});

// ─── Test robustezza input ────────────────────────────────────────────────────

describeIfLocal("WordEmbedding reale — robustezza input", () => {
  it("gestisce testo molto lungo senza errori", async () => {
    const result = await adapter.generateEmbedding("documento ".repeat(500));
    expect(result).toBeInstanceOf(Float32Array);
    expect(result.length).toBe(384);
  }, 15_000);

  it("gestisce stringa vuota senza errori", async () => {
    const result = await adapter.generateEmbedding("");
    expect(result).toBeInstanceOf(Float32Array);
    expect(result.length).toBe(384);
  }, 10_000);

  it("gestisce caratteri speciali e unicode", async () => {
    const result = await adapter.generateEmbedding('àèìòù — §42 "contratto" 中文');
    expect(result).toBeInstanceOf(Float32Array);
    expect(result.length).toBe(384);
  }, 10_000);

  it("gestisce numeri e codici", async () => {
    const result = await adapter.generateEmbedding("UUID-2026-ABC-123 protocollo n. 42/2026");
    expect(result).toBeInstanceOf(Float32Array);
    expect(result.length).toBe(384);
  }, 10_000);
});

// ─── Test ricerca semantica con repository mockati ────────────────────────────
//
// SearchSemanticUC(documentRepo, vectorRepo, aiAdapter)
//   - vectorRepo.searchSimilarVectors(vector, limit) → { documentId, score }[]
//   - documentRepo.getById(id) → Document | null
//
// Il flusso reale NON chiama più searchDocumentSemantic sul DAO.

describeIfLocal("Ricerca semantica reale — con DAO mockato", () => {
  let SearchSemanticUCClass: any;

  beforeAll(async () => {
    if (isCI || !modelExists) return;
    const ucMod = await import("../../../src/use-case/document/impl/SearchSemanticUC");
    SearchSemanticUCClass = ucMod.SearchSemanticUC;
  }, 10_000);

  // Costruisce il triplice mock e istanzia il caso d'uso
  const makeUc = (
    vectorResults: { documentId: number; score: number }[] = [],
    documents: { id: number; doc: any }[] = [],
  ) => {
    const vectorRepo = {
      searchSimilarVectors: vi.fn().mockResolvedValue(vectorResults),
    };

    const documentRepo = {
      getById: vi.fn().mockImplementation((id: number) =>
        documents.find((d) => d.id === id)?.doc ?? null,
      ),
    };

    const uc = new SearchSemanticUCClass(documentRepo, vectorRepo, adapter);
    return { vectorRepo, documentRepo, uc };
  };

  it("genera un embedding reale dalla query e lo passa al vectorRepo come Float32Array", async () => {
    const { vectorRepo, uc } = makeUc();

    await uc.execute("contratto di lavoro");

    const [vectorArg] = vectorRepo.searchSimilarVectors.mock.calls[0];
    expect(vectorArg).toBeInstanceOf(Float32Array);
    expect(vectorArg.length).toBe(384);
  }, 15_000);

  it("embedding di query simili producono vettori diversi ma vicini", async () => {
    const ctx1 = makeUc();
    const ctx2 = makeUc();

    await ctx1.uc.execute("contratto di lavoro");
    await ctx2.uc.execute("accordo lavorativo");

    const v1 = ctx1.vectorRepo.searchSimilarVectors.mock.calls[0][0] as Float32Array;
    const v2 = ctx2.vectorRepo.searchSimilarVectors.mock.calls[0][0] as Float32Array;

    expect(v1).not.toEqual(v2);
    expect(cosineSimilarity(v1, v2)).toBeGreaterThan(0.7);
  }, 15_000);

  it("embedding di query diverse producono vettori semanticamente distanti", async () => {
    const ctx1 = makeUc();
    const ctx2 = makeUc();

    await ctx1.uc.execute("contratto di compravendita");
    await ctx2.uc.execute("ricetta della pizza");

    const v1 = ctx1.vectorRepo.searchSimilarVectors.mock.calls[0][0] as Float32Array;
    const v2 = ctx2.vectorRepo.searchSimilarVectors.mock.calls[0][0] as Float32Array;

    expect(cosineSimilarity(v1, v2)).toBeLessThan(0.5);
  }, 15_000);

  it("flusso completo SearchSemanticUC — embedding reale e risultati vectorRepo passano invariati", async () => {
    const fakeDoc1 = { getUuid: () => "uuid-doc-1" };
    const fakeDoc2 = { getUuid: () => "uuid-doc-2" };

    const { uc } = makeUc(
      [{ documentId: 1, score: 0.9 }, { documentId: 2, score: 0.6 }],
      [{ id: 1, doc: fakeDoc1 }, { id: 2, doc: fakeDoc2 }],
    );

    const results = await uc.execute("contratto di lavoro");

    expect(results).toHaveLength(2);
    expect(results[0].score).toBeCloseTo(0.9, 5);
    expect(results[1].score).toBeCloseTo(0.6, 5);
    expect(results[0].document).toBe(fakeDoc1);
    expect(results[1].document).toBe(fakeDoc2);
  }, 15_000);

  it("query identica genera embedding identico", async () => {
    const ctx1 = makeUc();
    const ctx2 = makeUc();

    await ctx1.uc.execute("documento informatico");
    await ctx2.uc.execute("documento informatico");

    const v1 = ctx1.vectorRepo.searchSimilarVectors.mock.calls[0][0] as Float32Array;
    const v2 = ctx2.vectorRepo.searchSimilarVectors.mock.calls[0][0] as Float32Array;

    expect(Array.from(v1)).toEqual(Array.from(v2));
  }, 15_000);

  it("flusso completo con query in inglese — modello multilingua", async () => {
    const fakeDoc = { getUuid: () => "uuid-en" };

    const { uc } = makeUc(
      [{ documentId: 1, score: 0.85 }],
      [{ id: 1, doc: fakeDoc }],
    );

    const results = await uc.execute("employment contract");

    expect(results).toHaveLength(1);
    expect(results[0].score).toBeCloseTo(0.85, 5);
  }, 15_000);

  it("vettore generato da embedding reale non è nullo o tutto zero", async () => {
    const { vectorRepo, uc } = makeUc();

    await uc.execute("contratto notarile");

    const vector = vectorRepo.searchSimilarVectors.mock.calls[0][0] as Float32Array;
    const hasNonZero = Array.from(vector).some((v) => v !== 0);
    expect(hasNonZero).toBe(true);
  }, 15_000);

  it("lancia un errore se vectorRepo restituisce un documentId inesistente", async () => {
    const { uc } = makeUc([{ documentId: 999, score: 0.8 }], []);

    await expect(uc.execute("query senza documenti")).rejects.toThrow("999");
  }, 15_000);
});