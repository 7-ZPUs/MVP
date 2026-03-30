import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('electron', () => ({ app: { isPackaged: false } }));
vi.mock('@xenova/transformers', () => ({
    pipeline: vi.fn(),
    env: {
        localModelPath: '', allowLocalModels: true, allowRemoteModels: false,
        useBrowserCache: false, backends: { onnx: { executionProviders: [], wasm: { numThreads: 1 } } },
    },
}));

import { DocumentRepository } from '../../../src/repo/impl/DocumentRepository';
import { IWordEmbedding } from '../../../src/repo/IWordEmbedding';

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Vettore normalizzato di 384 dimensioni
const makeVector = (fill = 0.1) => new Float32Array(384).fill(fill);

// Costruisce un aiAdapter mock
const makeAiAdapter = (vector = makeVector()): IWordEmbedding => ({
    generateEmbedding: vi.fn().mockResolvedValue(vector),
    isInitialized:     vi.fn().mockReturnValue(true),
});

// Riga documento di esempio
const fakeDocRow    = { id: 1,  uuid: 'doc-uuid-1',  integrityStatus: 'UNKNOWN', processId: 1 };
const fakeDocRow2   = { id: 2,  uuid: 'doc-uuid-2',  integrityStatus: 'UNKNOWN', processId: 1 };
const fakeDocRow3   = { id: 3,  uuid: 'doc-uuid-3',  integrityStatus: 'UNKNOWN', processId: 1 };
const fakeDocRowNull = { id: 99, uuid: 'doc-uuid-99', integrityStatus: 'UNKNOWN', processId: 1 };

// Costruisce un db mock con sequenza di prepare configurabile
const makeDb = () => {
    const db = {
        exec:    vi.fn(),
        prepare: vi.fn(),
        _stmts:  [] as Array<{ get: any; all: any; run: any }>,
    };
    return db;
};

// Aggiunge uno statement mock alla sequenza di prepare
const addStmt = (db: ReturnType<typeof makeDb>, opts: { get?: any; all?: any; run?: any }) => {
    const stmt = {
        get: vi.fn().mockReturnValue(opts.get ?? null),
        all: vi.fn().mockReturnValue(opts.all ?? []),
        run: vi.fn().mockReturnValue(opts.run ?? { lastInsertRowid: 1 }),
    };
    db._stmts.push(stmt);
    db.prepare.mockReturnValueOnce(stmt);
    return stmt;
};

// Costruisce il repository con db e aiAdapter mockati
const makeRepo = (db: ReturnType<typeof makeDb>, ai = makeAiAdapter()) => {
    const repo = new DocumentRepository({ db } as any, ai);
    (repo as any).db = db;
    return repo;
};

// ─── Generazione embedding ────────────────────────────────────────────────────

describe('searchDocumentSemantic — generazione embedding', () => {

    it('chiama generateEmbedding con la query esatta', async () => {
        const ai = makeAiAdapter();
        const db = makeDb();
        addStmt(db, { all: [] }); // vss query
        const repo = makeRepo(db, ai);

        await repo.searchDocumentSemantic('contratto di vendita 2026');

        expect(ai.generateEmbedding).toHaveBeenCalledWith('contratto di vendita 2026');
        expect(ai.generateEmbedding).toHaveBeenCalledTimes(1);
    });

    it('chiama generateEmbedding una sola volta per chiamata', async () => {
        const ai = makeAiAdapter();
        const db = makeDb();
        addStmt(db, { all: [] });
        const repo = makeRepo(db, ai);

        await repo.searchDocumentSemantic('query');

        expect(ai.generateEmbedding).toHaveBeenCalledTimes(1);
    });

    it('genera embedding separati per query diverse', async () => {
        const ai = makeAiAdapter();
        const db = makeDb();
        addStmt(db, { all: [] });
        addStmt(db, { all: [] });
        const repo = makeRepo(db, ai);

        await repo.searchDocumentSemantic('prima query');
        await repo.searchDocumentSemantic('seconda query');

        expect(ai.generateEmbedding).toHaveBeenCalledTimes(2);
        expect(ai.generateEmbedding).toHaveBeenNthCalledWith(1, 'prima query');
        expect(ai.generateEmbedding).toHaveBeenNthCalledWith(2, 'seconda query');
    });

    it('propaga l\'eccezione se generateEmbedding fallisce', async () => {
        const ai: IWordEmbedding = {
            generateEmbedding: vi.fn().mockRejectedValue(new Error('Modello non inizializzato')),
            isInitialized:     vi.fn().mockReturnValue(false),
        };
        const db = makeDb();
        const repo = makeRepo(db, ai);

        await expect(repo.searchDocumentSemantic('query')).rejects.toThrow('Modello non inizializzato');
    });

    it('accetta query con caratteri speciali e unicode', async () => {
        const ai = makeAiAdapter();
        const db = makeDb();
        addStmt(db, { all: [] });
        const repo = makeRepo(db, ai);

        await repo.searchDocumentSemantic('documento àèìòù — §42 "contratto"');

        expect(ai.generateEmbedding).toHaveBeenCalledWith('documento àèìòù — §42 "contratto"');
    });

    it('accetta query molto lunghe senza troncare', async () => {
        const ai = makeAiAdapter();
        const db = makeDb();
        addStmt(db, { all: [] });
        const repo = makeRepo(db, ai);

        const longQuery = 'parola '.repeat(200).trim();
        await repo.searchDocumentSemantic(longQuery);

        expect(ai.generateEmbedding).toHaveBeenCalledWith(longQuery);
    });

    it('accetta query con stringa vuota', async () => {
        const ai = makeAiAdapter();
        const db = makeDb();
        addStmt(db, { all: [] });
        const repo = makeRepo(db, ai);

        await repo.searchDocumentSemantic('');

        expect(ai.generateEmbedding).toHaveBeenCalledWith('');
    });
});

// ─── Conversione toBuffer ─────────────────────────────────────────────────────

describe('searchDocumentSemantic — conversione Float32Array → Buffer', () => {

    it('passa un Buffer a sqlite-vss, non un Float32Array', async () => {
        const ai = makeAiAdapter(makeVector(0.5));
        const db = makeDb();
        const vssStmt = addStmt(db, { all: [] });
        const repo = makeRepo(db, ai);

        await repo.searchDocumentSemantic('test');

        const arg = vssStmt.all.mock.calls[0][0];
        expect(Buffer.isBuffer(arg)).toBe(true);
    });

    it('il buffer ha esattamente 384 * 4 = 1536 byte', async () => {
        const ai = makeAiAdapter(makeVector());
        const db = makeDb();
        const vssStmt = addStmt(db, { all: [] });
        const repo = makeRepo(db, ai);

        await repo.searchDocumentSemantic('test');

        const buf = vssStmt.all.mock.calls[0][0] as Buffer;
        expect(buf.byteLength).toBe(384 * 4);
    });

    it('i byte del buffer corrispondono ai byte del Float32Array originale', async () => {
        const vector = new Float32Array([0.1, 0.2, 0.3, 0.4, ...new Array(380).fill(0)]);
        const ai = makeAiAdapter(vector);
        const db = makeDb();
        const vssStmt = addStmt(db, { all: [] });
        const repo = makeRepo(db, ai);

        await repo.searchDocumentSemantic('test');

        const buf = vssStmt.all.mock.calls[0][0] as Buffer;
        const recovered = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
        expect(recovered[0]).toBeCloseTo(0.1, 5);
        expect(recovered[1]).toBeCloseTo(0.2, 5);
        expect(recovered[2]).toBeCloseTo(0.3, 5);
        expect(recovered[3]).toBeCloseTo(0.4, 5);
    });

    it('vettori diversi producono buffer diversi', async () => {
        const vector1 = makeVector(0.1);
        const vector2 = makeVector(0.9);
        const ai1 = makeAiAdapter(vector1);
        const ai2 = makeAiAdapter(vector2);
        const db1 = makeDb();
        const db2 = makeDb();
        const stmt1 = addStmt(db1, { all: [] });
        const stmt2 = addStmt(db2, { all: [] });

        const repo1 = makeRepo(db1, ai1);
        const repo2 = makeRepo(db2, ai2);

        await repo1.searchDocumentSemantic('query');
        await repo2.searchDocumentSemantic('query');

        const buf1 = stmt1.all.mock.calls[0][0] as Buffer;
        const buf2 = stmt2.all.mock.calls[0][0] as Buffer;

        expect(buf1.equals(buf2)).toBe(false);
    });

    it('il buffer mantiene la precisione float32', async () => {
        const vector = new Float32Array(384);
        vector[0] = Math.PI;
        vector[1] = Math.E;
        vector[383] = 0.123456789;
        const ai = makeAiAdapter(vector);
        const db = makeDb();
        const vssStmt = addStmt(db, { all: [] });
        const repo = makeRepo(db, ai);

        await repo.searchDocumentSemantic('precisione');

        const buf = vssStmt.all.mock.calls[0][0] as Buffer;
        const recovered = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
        // Float32 ha ~7 cifre significative
        expect(recovered[0]).toBeCloseTo(Math.PI, 5);
        expect(recovered[1]).toBeCloseTo(Math.E, 5);
        expect(recovered[383]).toBeCloseTo(0.123456789, 5);
    });
});

// ─── Query VSS ───────────────────────────────────────────────────────────────

describe('searchDocumentSemantic — query VSS', () => {

    it('passa il limite di 10 a sqlite-vss', async () => {
        const ai = makeAiAdapter();
        const db = makeDb();
        const vssStmt = addStmt(db, { all: [] });
        const repo = makeRepo(db, ai);

        await repo.searchDocumentSemantic('query');

        expect(vssStmt.all.mock.calls[0][1]).toBe(10);
    });

    it('usa vss_search nella query SQL', async () => {
        const ai = makeAiAdapter();
        const db = makeDb();
        addStmt(db, { all: [] });
        const repo = makeRepo(db, ai);

        await repo.searchDocumentSemantic('query');

        const sql = db.prepare.mock.calls[0][0] as string;
        expect(sql).toContain('vss_search');
    });

    it('interroga la tabella vss_documents', async () => {
        const ai = makeAiAdapter();
        const db = makeDb();
        addStmt(db, { all: [] });
        const repo = makeRepo(db, ai);

        await repo.searchDocumentSemantic('query');

        const sql = db.prepare.mock.calls[0][0] as string;
        expect(sql).toContain('vss_documents');
    });

    it('seleziona rowid e distance dalla tabella VSS', async () => {
        const ai = makeAiAdapter();
        const db = makeDb();
        addStmt(db, { all: [] });
        const repo = makeRepo(db, ai);

        await repo.searchDocumentSemantic('query');

        const sql = db.prepare.mock.calls[0][0] as string;
        expect(sql).toContain('rowid');
        expect(sql).toContain('distance');
    });

    it('ritorna array vuoto se vss_documents non ha risultati', async () => {
        const ai = makeAiAdapter();
        const db = makeDb();
        addStmt(db, { all: [] });
        const repo = makeRepo(db, ai);

        const results = await repo.searchDocumentSemantic('query senza risultati');

        expect(results).toEqual([]);
    });
});

// ─── Calcolo score ────────────────────────────────────────────────────────────

describe('searchDocumentSemantic — calcolo score (1 - distance)', () => {

    // Helper per configurare il db con un singolo risultato VSS
    const setupSingleResult = (db: ReturnType<typeof makeDb>, distance: number, docRow = fakeDocRow) => {
        addStmt(db, { all: [{ rowid: docRow.id, distance }] }); // vss
        addStmt(db, { get: docRow });                            // getById
        addStmt(db, { all: [] });                                // loadMetadata
    };

    it('score = 1 - distance per distance = 0.0 → score = 1.0', async () => {
        const db = makeDb();
        setupSingleResult(db, 0.0);
        const repo = makeRepo(db);

        const results = await repo.searchDocumentSemantic('query');

        expect(results[0].score).toBeCloseTo(1.0, 5);
    });

    it('score = 1 - distance per distance = 1.0 → score = 0.0', async () => {
        const db = makeDb();
        setupSingleResult(db, 1.0);
        const repo = makeRepo(db);

        const results = await repo.searchDocumentSemantic('query');

        expect(results[0].score).toBeCloseTo(0.0, 5);
    });

    it('score = 1 - distance per distance = 0.3 → score = 0.7', async () => {
        const db = makeDb();
        setupSingleResult(db, 0.3);
        const repo = makeRepo(db);

        const results = await repo.searchDocumentSemantic('query');

        expect(results[0].score).toBeCloseTo(0.7, 5);
    });

    it('score = 1 - distance per distance = 0.5 → score = 0.5', async () => {
        const db = makeDb();
        setupSingleResult(db, 0.5);
        const repo = makeRepo(db);

        const results = await repo.searchDocumentSemantic('query');

        expect(results[0].score).toBeCloseTo(0.5, 5);
    });

    it('score = 1 - distance per distance = 0.99 → score ≈ 0.01', async () => {
        const db = makeDb();
        setupSingleResult(db, 0.99);
        const repo = makeRepo(db);

        const results = await repo.searchDocumentSemantic('query');

        expect(results[0].score).toBeCloseTo(0.01, 5);
    });

    it('score = 1 - distance per distance = 0.001 → score ≈ 0.999', async () => {
        const db = makeDb();
        setupSingleResult(db, 0.001);
        const repo = makeRepo(db);

        const results = await repo.searchDocumentSemantic('query');

        expect(results[0].score).toBeCloseTo(0.999, 5);
    });

    it('preserva la precisione decimale dello score', async () => {
        const db = makeDb();
        setupSingleResult(db, 0.123456789);
        const repo = makeRepo(db);

        const results = await repo.searchDocumentSemantic('query');

        expect(results[0].score).toBeCloseTo(1 - 0.123456789, 5);
    });

    it('tutti gli score sono nel range [0.0, 1.0]', async () => {
        const distances = [0.0, 0.1, 0.25, 0.5, 0.75, 0.9, 1.0];
        const db = makeDb();
        addStmt(db, { all: distances.map((d, i) => ({ rowid: i + 1, distance: d })) }); // vss

        // Per ogni rowid aggiunge getById e loadMetadata
        distances.forEach((_, i) => {
            addStmt(db, { get: { ...fakeDocRow, id: i + 1, uuid: `uuid-${i}` } });
            addStmt(db, { all: [] });
        });

        const repo = makeRepo(db);
        const results = await repo.searchDocumentSemantic('query');

        results.forEach(r => {
            expect(r.score).toBeGreaterThanOrEqual(0.0);
            expect(r.score).toBeLessThanOrEqual(1.0);
        });
    });
});

// ─── Recupero documenti ───────────────────────────────────────────────────────

describe('searchDocumentSemantic — recupero documenti via getById', () => {

    it('recupera il documento usando il rowid restituito da VSS', async () => {
        const db = makeDb();
        addStmt(db, { all: [{ rowid: 42, distance: 0.2 }] }); // vss
        const docStmt = addStmt(db, { get: { ...fakeDocRow, id: 42 } }); // getById
        addStmt(db, { all: [] }); // loadMetadata
        const repo = makeRepo(db);

        await repo.searchDocumentSemantic('query');

        // La query getById deve usare il rowid corretto
        expect(docStmt.get.mock.calls[0][0]).toBe(42);
    });

    it('filtra i documenti non trovati da getById — null safety', async () => {
        const db = makeDb();
        addStmt(db, { all: [
            { rowid: 1, distance: 0.1 },
            { rowid: 99, distance: 0.2 }, // questo non esiste
            { rowid: 2, distance: 0.3 },
        ]});
        addStmt(db, { get: fakeDocRow  }); // getById rowid=1
        addStmt(db, { all: [] });           // loadMetadata
        addStmt(db, { get: null });         // getById rowid=99 → null
        addStmt(db, { get: fakeDocRow2 }); // getById rowid=2
        addStmt(db, { all: [] });           // loadMetadata
        const repo = makeRepo(db);

        const results = await repo.searchDocumentSemantic('query');

        expect(results).toHaveLength(2);
        expect(results.map(r => r.document.getUuid())).toContain('doc-uuid-1');
        expect(results.map(r => r.document.getUuid())).toContain('doc-uuid-2');
    });

    it('ritorna array vuoto se tutti i rowid restituiti da VSS non esistono nel DB', async () => {
        const db = makeDb();
        addStmt(db, { all: [
            { rowid: 99,  distance: 0.1 },
            { rowid: 100, distance: 0.2 },
        ]});
        addStmt(db, { get: null }); // getById → null
        addStmt(db, { get: null }); // getById → null
        const repo = makeRepo(db);

        const results = await repo.searchDocumentSemantic('query');

        expect(results).toEqual([]);
    });

    it('l\'uuid del documento nel risultato corrisponde al documento recuperato', async () => {
        const db = makeDb();
        addStmt(db, { all: [{ rowid: 1, distance: 0.15 }] });
        addStmt(db, { get: { id: 1, uuid: 'uuid-specifico', integrityStatus: 'UNKNOWN', processId: 1 } });
        addStmt(db, { all: [] });
        const repo = makeRepo(db);

        const results = await repo.searchDocumentSemantic('query');

        expect(results[0].document.getUuid()).toBe('uuid-specifico');
    });

    it('gestisce correttamente 10 risultati VSS tutti esistenti', async () => {
        const db = makeDb();
        const vssRows = Array.from({ length: 10 }, (_, i) => ({ rowid: i + 1, distance: i * 0.05 }));
        addStmt(db, { all: vssRows });

        vssRows.forEach((_, i) => {
            addStmt(db, { get: { id: i + 1, uuid: `uuid-${i}`, integrityStatus: 'UNKNOWN', processId: 1 } });
            addStmt(db, { all: [] });
        });

        const repo = makeRepo(db);
        const results = await repo.searchDocumentSemantic('query');

        expect(results).toHaveLength(10);
    });

    it('gestisce correttamente 10 risultati VSS con alcuni null', async () => {
        const db = makeDb();
        const vssRows = Array.from({ length: 10 }, (_, i) => ({ rowid: i + 1, distance: i * 0.05 }));
        addStmt(db, { all: vssRows });

        vssRows.forEach((_, i) => {
            // I documenti con indice pari esistono, quelli dispari no
            addStmt(db, { get: i % 2 === 0
                ? { id: i + 1, uuid: `uuid-${i}`, integrityStatus: 'UNKNOWN', processId: 1 }
                : null
            });
            if (i % 2 === 0) addStmt(db, { all: [] }); // loadMetadata solo per quelli trovati
        });

        const repo = makeRepo(db);
        const results = await repo.searchDocumentSemantic('query');

        expect(results).toHaveLength(5);
    });
});

// ─── Ordine risultati ─────────────────────────────────────────────────────────

describe('searchDocumentSemantic — ordine risultati', () => {

    it('preserva l\'ordine restituito da VSS (score decrescente)', async () => {
        const db = makeDb();
        addStmt(db, { all: [
            { rowid: 1, distance: 0.05 }, // score 0.95
            { rowid: 2, distance: 0.20 }, // score 0.80
            { rowid: 3, distance: 0.40 }, // score 0.60
        ]});
        addStmt(db, { get: fakeDocRow  }); addStmt(db, { all: [] });
        addStmt(db, { get: fakeDocRow2 }); addStmt(db, { all: [] });
        addStmt(db, { get: fakeDocRow3 }); addStmt(db, { all: [] });
        const repo = makeRepo(db);

        const results = await repo.searchDocumentSemantic('query');

        expect(results[0].score).toBeGreaterThan(results[1].score);
        expect(results[1].score).toBeGreaterThan(results[2].score);
    });

    it('non riordina i risultati — l\'ordine viene da VSS', async () => {
        const db = makeDb();
        // VSS ritorna già in ordine di distanza crescente
        addStmt(db, { all: [
            { rowid: 3, distance: 0.1 },
            { rowid: 1, distance: 0.5 },
            { rowid: 2, distance: 0.9 },
        ]});
        addStmt(db, { get: fakeDocRow3 }); addStmt(db, { all: [] });
        addStmt(db, { get: fakeDocRow  }); addStmt(db, { all: [] });
        addStmt(db, { get: fakeDocRow2 }); addStmt(db, { all: [] });
        const repo = makeRepo(db);

        const results = await repo.searchDocumentSemantic('query');

        // Il primo risultato deve avere uuid del doc con rowid=3
        expect(results[0].document.getUuid()).toBe('doc-uuid-3');
        expect(results[1].document.getUuid()).toBe('doc-uuid-1');
        expect(results[2].document.getUuid()).toBe('doc-uuid-2');
    });
});

// ─── Struttura del risultato ──────────────────────────────────────────────────

describe('searchDocumentSemantic — struttura risultato', () => {

    it('ogni risultato ha i campi document e score', async () => {
        const db = makeDb();
        addStmt(db, { all: [{ rowid: 1, distance: 0.3 }] });
        addStmt(db, { get: fakeDocRow });
        addStmt(db, { all: [] });
        const repo = makeRepo(db);

        const results = await repo.searchDocumentSemantic('query');

        expect(results[0]).toHaveProperty('document');
        expect(results[0]).toHaveProperty('score');
    });

    it('document è un\'istanza di Document', async () => {
        const db = makeDb();
        addStmt(db, { all: [{ rowid: 1, distance: 0.2 }] });
        addStmt(db, { get: fakeDocRow });
        addStmt(db, { all: [] });
        const repo = makeRepo(db);

        const results = await repo.searchDocumentSemantic('query');

        // Verifica che abbia i metodi dell'entità Document
        expect(typeof results[0].document.getUuid).toBe('function');
        expect(typeof results[0].document.getId).toBe('function');
        expect(typeof results[0].document.getMetadata).toBe('function');
    });

    it('score è un numero, mai undefined o null', async () => {
        const db = makeDb();
        addStmt(db, { all: [{ rowid: 1, distance: 0.4 }] });
        addStmt(db, { get: fakeDocRow });
        addStmt(db, { all: [] });
        const repo = makeRepo(db);

        const results = await repo.searchDocumentSemantic('query');

        expect(typeof results[0].score).toBe('number');
        expect(results[0].score).not.toBeNull();
        expect(results[0].score).not.toBeUndefined();
    });

    it('score è sempre un numero finito', async () => {
        const db = makeDb();
        addStmt(db, { all: [{ rowid: 1, distance: 0.5 }] });
        addStmt(db, { get: fakeDocRow });
        addStmt(db, { all: [] });
        const repo = makeRepo(db);

        const results = await repo.searchDocumentSemantic('query');

        expect(Number.isFinite(results[0].score)).toBe(true);
    });

    it('ritorna un array, mai null o undefined', async () => {
        const db = makeDb();
        addStmt(db, { all: [] });
        const repo = makeRepo(db);

        const results = await repo.searchDocumentSemantic('query');

        expect(Array.isArray(results)).toBe(true);
        expect(results).not.toBeNull();
    });
});

// ─── Chiamate multiple ────────────────────────────────────────────────────────

describe('searchDocumentSemantic — chiamate multiple', () => {

    it('due chiamate successive sono indipendenti', async () => {
        const ai = makeAiAdapter();
        const db = makeDb();

        // Prima chiamata: un risultato
        addStmt(db, { all: [{ rowid: 1, distance: 0.1 }] });
        addStmt(db, { get: fakeDocRow });
        addStmt(db, { all: [] });

        // Seconda chiamata: nessun risultato
        addStmt(db, { all: [] });

        const repo = makeRepo(db, ai);

        const r1 = await repo.searchDocumentSemantic('prima');
        const r2 = await repo.searchDocumentSemantic('seconda');

        expect(r1).toHaveLength(1);
        expect(r2).toHaveLength(0);
    });

    it('chiamate parallele non interferiscono tra loro', async () => {
        // Due repository separati simulano chiamate parallele
        const db1 = makeDb();
        const db2 = makeDb();

        addStmt(db1, { all: [{ rowid: 1, distance: 0.1 }] });
        addStmt(db1, { get: fakeDocRow  }); addStmt(db1, { all: [] });

        addStmt(db2, { all: [{ rowid: 2, distance: 0.2 }] });
        addStmt(db2, { get: fakeDocRow2 }); addStmt(db2, { all: [] });

        const repo1 = makeRepo(db1);
        const repo2 = makeRepo(db2);

        const [r1, r2] = await Promise.all([
            repo1.searchDocumentSemantic('query1'),
            repo2.searchDocumentSemantic('query2'),
        ]);

        expect(r1[0].document.getUuid()).toBe('doc-uuid-1');
        expect(r2[0].document.getUuid()).toBe('doc-uuid-2');
    });
});