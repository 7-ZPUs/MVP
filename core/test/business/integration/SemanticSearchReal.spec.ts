import { vi, describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

// ─── Skip in CI ───────────────────────────────────────────────────────────────
const isCI        = process.env.CI === 'true';
const modelsPath  = path.join(process.cwd(), 'core', 'src', 'models', 'Xenova');
const modelFile   = path.join(modelsPath, 'paraphrase-multilingual-MiniLM-L12-v2', 'onnx', 'model_quantized.onnx');
const modelExists = fs.existsSync(modelFile);

const describeIfLocal = isCI || !modelExists ? describe.skip : describe;

// ─── Setup modello reale ──────────────────────────────────────────────────────

let adapter: any;

const makeStmt = (opts: { get?: any; all?: any; run?: any } = {}) => ({
    get: vi.fn().mockReturnValue(opts.get ?? null),
    all: vi.fn().mockReturnValue(opts.all ?? []),
    run: vi.fn().mockReturnValue(opts.run ?? { lastInsertRowid: 1 }),
});

const makeDb = () => ({
    exec:    vi.fn(),
    prepare: vi.fn().mockReturnValue(makeStmt()),
});

// Costruisce una riga documento SQLite
const makeDocRow = (id: number, uuid: string) => ({
    id, uuid, integrityStatus: 'UNKNOWN', processId: 1,
});

beforeAll(async () => {
    if (isCI || !modelExists) return;

    vi.mock('electron', () => ({ app: { isPackaged: false } }));

    const mod = await import('../../../src/repo/impl/WordEmbedding');
    adapter = new mod.WordEmbedding();
    await adapter.initialize();
}, 30_000);

// ─── Helper: calcola similarità coseno ───────────────────────────────────────

const cosineSimilarity = (a: Float32Array, b: Float32Array): number => {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < a.length; i++) {
        dot   += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

// ─── Test generazione embedding ───────────────────────────────────────────────

describeIfLocal('WordEmbedding reale — generazione embedding', () => {

    it('genera un Float32Array di 384 dimensioni', async () => {
        const result = await adapter.generateEmbedding('documento contratto');
        expect(result).toBeInstanceOf(Float32Array);
        expect(result.length).toBe(384);
    }, 10_000);

    it('il vettore è normalizzato — norma ≈ 1.0', async () => {
        const result = await adapter.generateEmbedding('testo di prova');
        const norm = Math.sqrt((Array.from(result) as number[]).reduce((sum, v) => sum + v * v, 0));
        expect(norm).toBeCloseTo(1.0, 2);
    }, 10_000);

    it('tutti i valori del vettore sono nel range [-1, 1]', async () => {
        const result = await adapter.generateEmbedding('test range valori');
        Array.from(result).forEach(v => {
            expect(v).toBeGreaterThanOrEqual(-1);
            expect(v).toBeLessThanOrEqual(1);
        });
    }, 10_000);

    it('testi diversi producono vettori diversi', async () => {
        const v1 = await adapter.generateEmbedding('contratto di vendita');
        const v2 = await adapter.generateEmbedding('verbale di assemblea');
        let areDifferent = false;
        for (let i = 0; i < v1.length; i++) {
            if (Math.abs(v1[i] - v2[i]) > 0.001) { areDifferent = true; break; }
        }
        expect(areDifferent).toBe(true);
    }, 10_000);

    it('lo stesso testo produce sempre lo stesso vettore', async () => {
        const text = 'documento informatico';
        const v1 = await adapter.generateEmbedding(text);
        const v2 = await adapter.generateEmbedding(text);
        for (let i = 0; i < v1.length; i++) {
            expect(v1[i]).toBeCloseTo(v2[i], 5);
        }
    }, 10_000);
});

// ─── Test similarità semantica ────────────────────────────────────────────────

describeIfLocal('WordEmbedding reale — similarità semantica', () => {

    it('frasi semanticamente simili hanno similarità > 0.7', async () => {
        const v1 = await adapter.generateEmbedding('contratto di compravendita immobile');
        const v2 = await adapter.generateEmbedding('accordo per la vendita di un immobile');
        expect(cosineSimilarity(v1, v2)).toBeGreaterThan(0.7);
    }, 15_000);

    it('frasi semanticamente diverse hanno similarità < 0.5', async () => {
        const v1 = await adapter.generateEmbedding('contratto di compravendita immobile');
        const v2 = await adapter.generateEmbedding('ricetta della pizza margherita');
        expect(cosineSimilarity(v1, v2)).toBeLessThan(0.5);
    }, 15_000);

    it('la stessa frase ha similarità = 1.0 con se stessa', async () => {
        const v = await adapter.generateEmbedding('documento amministrativo informatico');
        expect(cosineSimilarity(v, v)).toBeCloseTo(1.0, 4);
    }, 10_000);

    it('frasi in italiano simili hanno similarità alta', async () => {
        const v1 = await adapter.generateEmbedding('verbale di riunione del consiglio');
        const v2 = await adapter.generateEmbedding('resoconto della seduta del consiglio');
        expect(cosineSimilarity(v1, v2)).toBeGreaterThan(0.75);
    }, 15_000);

    it('documenti amministrativi simili hanno similarità > 0.7', async () => {
        const v1 = await adapter.generateEmbedding('delibera di giunta comunale');
        const v2 = await adapter.generateEmbedding('deliberazione della giunta municipale');
        expect(cosineSimilarity(v1, v2)).toBeGreaterThan(0.7);
    }, 15_000);

    it('la similarità è simmetrica — sim(a,b) = sim(b,a)', async () => {
        const v1 = await adapter.generateEmbedding('atto notarile');
        const v2 = await adapter.generateEmbedding('documento notarile');
        expect(cosineSimilarity(v1, v2)).toBeCloseTo(cosineSimilarity(v2, v1), 5);
    }, 15_000);

    it('testo multilingua — italiano e inglese simili hanno similarità > 0.6', async () => {
        const v1 = await adapter.generateEmbedding('contratto di lavoro');
        const v2 = await adapter.generateEmbedding('employment contract');
        expect(cosineSimilarity(v1, v2)).toBeGreaterThan(0.6);
    }, 15_000);

    it('score come 1 - distanza è nel range [0, 1]', async () => {
        const v1 = await adapter.generateEmbedding('fattura elettronica');
        const v2 = await adapter.generateEmbedding('documento fiscale elettronico');
        const score = cosineSimilarity(v1, v2);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
    }, 15_000);
});

// ─── Test robustezza input ────────────────────────────────────────────────────

describeIfLocal('WordEmbedding reale — robustezza input', () => {

    it('gestisce testo molto lungo senza errori', async () => {
        const result = await adapter.generateEmbedding('documento '.repeat(500));
        expect(result).toBeInstanceOf(Float32Array);
        expect(result.length).toBe(384);
    }, 15_000);

    it('gestisce stringa vuota senza errori', async () => {
        const result = await adapter.generateEmbedding('');
        expect(result).toBeInstanceOf(Float32Array);
        expect(result.length).toBe(384);
    }, 10_000);

    it('gestisce caratteri speciali e unicode', async () => {
        const result = await adapter.generateEmbedding('àèìòù — §42 "contratto" 中文');
        expect(result).toBeInstanceOf(Float32Array);
        expect(result.length).toBe(384);
    }, 10_000);

    it('gestisce numeri e codici', async () => {
        const result = await adapter.generateEmbedding('UUID-2026-ABC-123 protocollo n. 42/2026');
        expect(result).toBeInstanceOf(Float32Array);
        expect(result.length).toBe(384);
    }, 10_000);
});

// ─── Test ricerca semantica con DB mockato ────────────────────────────────────

describeIfLocal('Ricerca semantica reale — con DB mockato', () => {

    // Importa DocumentRepository e SearchSemanticUC dopo il setup del modello
    let DocumentRepositoryClass: any;
    let SearchSemanticUCClass: any;

    beforeAll(async () => {
        if (isCI || !modelExists) return;
        const repoMod = await import('../../../src/repo/impl/DocumentRepository');
        const ucMod   = await import('../../../src/use-case/document/impl/SearchSemanticUC');
        DocumentRepositoryClass = repoMod.DocumentRepository;
        SearchSemanticUCClass   = ucMod.SearchSemanticUC;
    }, 10_000);

    // Costruisce repo con adapter reale e DB mockato
    const makeRepoWithRealAi = (dbSetup: (db: ReturnType<typeof makeDb>) => void) => {
        const db = makeDb();
        dbSetup(db);
        const repo = new DocumentRepositoryClass({ db } as any, adapter);
        (repo as any).db = db;
        return { repo, db };
    };

    it('genera un embedding reale dalla query e lo passa al DB come Buffer', async () => {
        const db = makeDb();
        const vssStmt = makeStmt({ all: [] });
        db.prepare.mockReturnValue(vssStmt);

        const repo = new DocumentRepositoryClass({ db } as any, adapter);
        (repo as any).db = db;

        await repo.searchDocumentSemantic('contratto di lavoro');

        // Il buffer passato deve avere 384 * 4 = 1536 byte
        const bufferArg = vssStmt.all.mock.calls[0][0] as Buffer;
        expect(Buffer.isBuffer(bufferArg)).toBe(true);
        expect(bufferArg.byteLength).toBe(384 * 4);
    }, 15_000);

    it('embedding di query simili producono buffer diversi ma vicini', async () => {
        const db1 = makeDb();
        const db2 = makeDb();
        const stmt1 = makeStmt({ all: [] });
        const stmt2 = makeStmt({ all: [] });
        db1.prepare.mockReturnValue(stmt1);
        db2.prepare.mockReturnValue(stmt2);

        const repo1 = new DocumentRepositoryClass({ db: db1 } as any, adapter);
        const repo2 = new DocumentRepositoryClass({ db: db2 } as any, adapter);
        (repo1 as any).db = db1;
        (repo2 as any).db = db2;

        await repo1.searchDocumentSemantic('contratto di lavoro');
        await repo2.searchDocumentSemantic('accordo lavorativo');

        const buf1 = stmt1.all.mock.calls[0][0] as Buffer;
        const buf2 = stmt2.all.mock.calls[0][0] as Buffer;

        // I buffer devono essere diversi (query diverse → embedding diversi)
        expect(buf1.equals(buf2)).toBe(false);

        // Ma i vettori devono essere semanticamente vicini
        const v1 = new Float32Array(buf1.buffer, buf1.byteOffset, buf1.byteLength / 4);
        const v2 = new Float32Array(buf2.buffer, buf2.byteOffset, buf2.byteLength / 4);
        expect(cosineSimilarity(v1, v2)).toBeGreaterThan(0.7);
    }, 15_000);

    it('embedding di query diverse producono buffer semanticamente distanti', async () => {
        const db1 = makeDb();
        const db2 = makeDb();
        const stmt1 = makeStmt({ all: [] });
        const stmt2 = makeStmt({ all: [] });
        db1.prepare.mockReturnValue(stmt1);
        db2.prepare.mockReturnValue(stmt2);

        const repo1 = new DocumentRepositoryClass({ db: db1 } as any, adapter);
        const repo2 = new DocumentRepositoryClass({ db: db2 } as any, adapter);
        (repo1 as any).db = db1;
        (repo2 as any).db = db2;

        await repo1.searchDocumentSemantic('contratto di compravendita');
        await repo2.searchDocumentSemantic('ricetta della pizza');

        const buf1 = stmt1.all.mock.calls[0][0] as Buffer;
        const buf2 = stmt2.all.mock.calls[0][0] as Buffer;

        const v1 = new Float32Array(buf1.buffer, buf1.byteOffset, buf1.byteLength / 4);
        const v2 = new Float32Array(buf2.buffer, buf2.byteOffset, buf2.byteLength / 4);
        expect(cosineSimilarity(v1, v2)).toBeLessThan(0.5);
    }, 15_000);

    it('lo score calcolato da 1 - distance riflette la similarità reale', async () => {
        const db = makeDb();

        // VSS ritorna distance = 0.2 — score atteso = 0.8
        const vssStmt  = makeStmt({ all: [{ rowid: 1, distance: 0.2 }] });
        const docStmt  = makeStmt({ get: makeDocRow(1, 'uuid-contratto') });
        const metaStmt = makeStmt({ all: [] });

        db.prepare
            .mockReturnValueOnce(vssStmt)
            .mockReturnValueOnce(docStmt)
            .mockReturnValueOnce(metaStmt);

        const repo = new DocumentRepositoryClass({ db } as any, adapter);
        (repo as any).db = db;

        const results = await repo.searchDocumentSemantic('contratto di lavoro');

        expect(results).toHaveLength(1);
        expect(results[0].score).toBeCloseTo(0.8, 5);
        expect(results[0].document.getUuid()).toBe('uuid-contratto');
    }, 15_000);

    it('risultati multipli con score decrescente preservano l\'ordine del DB', async () => {
        const db = makeDb();

        const vssStmt = makeStmt({ all: [
            { rowid: 1, distance: 0.05 }, // score 0.95
            { rowid: 2, distance: 0.30 }, // score 0.70
            { rowid: 3, distance: 0.60 }, // score 0.40
        ]});

        db.prepare
            .mockReturnValueOnce(vssStmt)
            .mockReturnValueOnce(makeStmt({ get: makeDocRow(1, 'uuid-alto') }))
            .mockReturnValueOnce(makeStmt({ all: [] }))
            .mockReturnValueOnce(makeStmt({ get: makeDocRow(2, 'uuid-medio') }))
            .mockReturnValueOnce(makeStmt({ all: [] }))
            .mockReturnValueOnce(makeStmt({ get: makeDocRow(3, 'uuid-basso') }))
            .mockReturnValueOnce(makeStmt({ all: [] }));

        const repo = new DocumentRepositoryClass({ db } as any, adapter);
        (repo as any).db = db;

        const results = await repo.searchDocumentSemantic('documento');

        expect(results).toHaveLength(3);
        expect(results[0].score).toBeCloseTo(0.95, 5);
        expect(results[1].score).toBeCloseTo(0.70, 5);
        expect(results[2].score).toBeCloseTo(0.40, 5);
        expect(results[0].document.getUuid()).toBe('uuid-alto');
    }, 15_000);

    it('flusso completo SearchSemanticUC — embedding reale → SearchResult[]', async () => {
        const db = makeDb();

        const vssStmt = makeStmt({ all: [
            { rowid: 1, distance: 0.1 },
            { rowid: 2, distance: 0.4 },
        ]});

        db.prepare
            .mockReturnValueOnce(vssStmt)
            .mockReturnValueOnce(makeStmt({ get: makeDocRow(1, 'uuid-doc-1') }))
            .mockReturnValueOnce(makeStmt({ all: [
                // SearchSemanticUC cerca m.name === 'nome' e m.name === 'tipoDocumento'
                { name: 'nome', value: 'contratto.pdf', type: 'string' },
                { name: 'tipoDocumento', value: 'DOCUMENTO INFORMATICO', type: 'string' },
            ]}))
            .mockReturnValueOnce(makeStmt({ get: makeDocRow(2, 'uuid-doc-2') }))
            .mockReturnValueOnce(makeStmt({ all: [
                { name: 'nome', value: 'verbale.pdf', type: 'string' },
                { name: 'tipoDocumento', value: 'DOCUMENTO AMMINISTRATIVO INFORMATICO', type: 'string' },
            ]}));

        const repo = new DocumentRepositoryClass({ db } as any, adapter);
        (repo as any).db = db;

        const uc = new SearchSemanticUCClass(repo);
        const results = await uc.execute('contratto di lavoro');

        expect(results).toHaveLength(2);
        expect(results[0].documentId).toBe('uuid-doc-1');
        expect(results[0].name).toBe('contratto.pdf');
        expect(results[0].type).toBe('DOCUMENTO INFORMATICO');
        expect(results[0].score).toBeCloseTo(0.9, 5);
        expect(results[1].documentId).toBe('uuid-doc-2');
        expect(results[1].name).toBe('verbale.pdf');
        expect(results[1].score).toBeCloseTo(0.6, 5);
    }, 15_000);

    it('query identica genera embedding identico e stesso buffer', async () => {
        const db1 = makeDb();
        const db2 = makeDb();
        const stmt1 = makeStmt({ all: [] });
        const stmt2 = makeStmt({ all: [] });
        db1.prepare.mockReturnValue(stmt1);
        db2.prepare.mockReturnValue(stmt2);

        const repo1 = new DocumentRepositoryClass({ db: db1 } as any, adapter);
        const repo2 = new DocumentRepositoryClass({ db: db2 } as any, adapter);
        (repo1 as any).db = db1;
        (repo2 as any).db = db2;

        await repo1.searchDocumentSemantic('documento informatico');
        await repo2.searchDocumentSemantic('documento informatico');

        const buf1 = stmt1.all.mock.calls[0][0] as Buffer;
        const buf2 = stmt2.all.mock.calls[0][0] as Buffer;

        // Stessa query → stesso embedding → stesso buffer
        expect(buf1.equals(buf2)).toBe(true);
    }, 15_000);

    it('il limite di 10 risultati viene rispettato anche con embedding reale', async () => {
        const db = makeDb();
        const vssStmt = makeStmt({ all: [] }); // nessun risultato
        db.prepare.mockReturnValue(vssStmt);

        const repo = new DocumentRepositoryClass({ db } as any, adapter);
        (repo as any).db = db;

        const results = await repo.searchDocumentSemantic('query qualsiasi');

        // Il secondo argomento passato a vss_search deve essere 10
        expect(vssStmt.all.mock.calls[0][1]).toBe(10);
        expect(results).toHaveLength(0);
    }, 15_000);

    it('documento non trovato in DB viene filtrato anche con embedding reale', async () => {
        const db = makeDb();

        const vssStmt = makeStmt({ all: [{ rowid: 99, distance: 0.1 }] });
        const docStmt = makeStmt({ get: null }); // documento non esiste

        db.prepare
            .mockReturnValueOnce(vssStmt)
            .mockReturnValueOnce(docStmt);

        const repo = new DocumentRepositoryClass({ db } as any, adapter);
        (repo as any).db = db;

        const results = await repo.searchDocumentSemantic('contratto');

        expect(results).toHaveLength(0);
    }, 15_000);

    it('flusso completo con query in inglese — modello multilingua', async () => {
        const db = makeDb();

        const vssStmt = makeStmt({ all: [{ rowid: 1, distance: 0.15 }] });

        db.prepare
            .mockReturnValueOnce(vssStmt)
            .mockReturnValueOnce(makeStmt({ get: makeDocRow(1, 'uuid-en') }))
            .mockReturnValueOnce(makeStmt({ all: [
                { name: 'nome', value: 'contract.pdf', type: 'string' },
                { name: 'tipoDocumento', value: 'DOCUMENTO INFORMATICO', type: 'string' },
            ]}));

        const repo = new DocumentRepositoryClass({ db } as any, adapter);
        (repo as any).db = db;

        const uc = new SearchSemanticUCClass(repo);
        const results = await uc.execute('employment contract');

        expect(results).toHaveLength(1);
        expect(results[0].documentId).toBe('uuid-en');
        expect(results[0].score).toBeCloseTo(0.85, 5);
    }, 15_000);

    it('buffer generato da embedding reale ha byte non tutti uguali a zero', async () => {
        const db = makeDb();
        const vssStmt = makeStmt({ all: [] });
        db.prepare.mockReturnValue(vssStmt);

        const repo = new DocumentRepositoryClass({ db } as any, adapter);
        (repo as any).db = db;

        await repo.searchDocumentSemantic('contratto notarile');

        const buf = vssStmt.all.mock.calls[0][0] as Buffer;
        const hasNonZero = Array.from(buf).some(b => b !== 0);
        expect(hasNonZero).toBe(true);
    }, 15_000);
});