import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dichiarati prima di qualsiasi import per garantire l'hoisting corretto
vi.mock('electron', () => ({ app: { isPackaged: false } }));
vi.mock('@xenova/transformers', () => ({
    pipeline: vi.fn(),
    env: {
        localModelPath:   '',
        allowLocalModels:  true,
        allowRemoteModels: false,
        useBrowserCache:   false,
        backends: { onnx: { executionProviders: [], wasm: { numThreads: 1 } } },
    },
}));
vi.mock('node:fs', () => ({
    existsSync: vi.fn().mockReturnValue(true),
}));

import { pipeline } from '@xenova/transformers';
import { env } from '@xenova/transformers';
import * as fs from 'node:fs';
import { WordEmbedding } from '../../../src/repo/impl/WordEmbedding';

// Costruisce un embedder mock che ritorna un vettore di dimensione fissa
const makeMockEmbedder = (data: Float32Array) =>
    vi.fn().mockResolvedValue({ data });

// Vettore normalizzato di 384 dimensioni (dimensione del modello MiniLM)
const make384Vector = (fill = 0.1) => new Float32Array(384).fill(fill);

describe('WordEmbedding', () => {
    let adapter: WordEmbedding;

    beforeEach(() => {
        vi.clearAllMocks();
        // existsSync ritorna true di default — il modello esiste
        (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true);
        adapter = new WordEmbedding();
    });

    // ─── isInitialized ───────────────────────────────────────────────────────

    it('isInitialized() ritorna false prima di qualsiasi chiamata', () => {
        expect(adapter.isInitialized()).toBe(false);
    });

    it('isInitialized() ritorna true dopo initialize()', async () => {
        (pipeline as ReturnType<typeof vi.fn>).mockResolvedValue(makeMockEmbedder(make384Vector()));
        await adapter.initialize();
        expect(adapter.isInitialized()).toBe(true);
    });

    // ─── initialize ──────────────────────────────────────────────────────────

    it('chiama pipeline con i parametri corretti del modello', async () => {
        (pipeline as ReturnType<typeof vi.fn>).mockResolvedValue(makeMockEmbedder(make384Vector()));

        await adapter.initialize();

        expect(pipeline).toHaveBeenCalledWith(
            'feature-extraction',
            'paraphrase-multilingual-MiniLM-L12-v2',
            { quantized: true, local_files_only: true }
        );
    });

    it('initialize() è idempotente — pipeline non viene richiamata', async () => {
        (pipeline as ReturnType<typeof vi.fn>).mockResolvedValue(makeMockEmbedder(make384Vector()));

        await adapter.initialize();
        await adapter.initialize();
        await adapter.initialize();

        expect(pipeline).toHaveBeenCalledTimes(1);
    });

    it('configura transformers env per usare modelli locali su CPU', () => {
        expect(env.allowLocalModels).toBe(true);
        expect(env.allowRemoteModels).toBe(false);
        expect(env.useBrowserCache).toBe(false);
        expect(env.backends.onnx.executionProviders).toEqual(['cpu']);
    });

    it('lancia errore con path se la cartella modelli non esiste', async () => {
        (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

        await expect(adapter.initialize()).rejects.toThrow('[AI] Cartella modelli non trovata');
    });

    it('non modifica isInitialized se initialize() fallisce', async () => {
        (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

        await adapter.initialize().catch(() => {});

        expect(adapter.isInitialized()).toBe(false);
    });

    it('propaga errore di pipeline e mantiene initialized=false', async () => {
        (pipeline as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('model load failed'));

        await expect(adapter.initialize()).rejects.toThrow('model load failed');
        expect(adapter.isInitialized()).toBe(false);
    });

    it('consente retry di initialize dopo errore precedente', async () => {
        (pipeline as ReturnType<typeof vi.fn>)
            .mockRejectedValueOnce(new Error('temporary load failure'))
            .mockResolvedValueOnce(makeMockEmbedder(make384Vector()));

        await expect(adapter.initialize()).rejects.toThrow('temporary load failure');
        expect(adapter.isInitialized()).toBe(false);

        await adapter.initialize();
        expect(adapter.isInitialized()).toBe(true);
        expect(pipeline).toHaveBeenCalledTimes(2);
    });

    // ─── generateEmbedding ───────────────────────────────────────────────────

    it('ritorna un Float32Array con i dati del modello', async () => {
        const fakeVector = make384Vector(0.5);
        (pipeline as ReturnType<typeof vi.fn>).mockResolvedValue(makeMockEmbedder(fakeVector));

        const result = await adapter.generateEmbedding('testo di prova');

        expect(result).toBeInstanceOf(Float32Array);
        expect(result).toBe(fakeVector);
    });

    it('chiama l\'embedder con pooling mean e normalize true', async () => {
        const mockEmbedder = makeMockEmbedder(make384Vector());
        (pipeline as ReturnType<typeof vi.fn>).mockResolvedValue(mockEmbedder);

        await adapter.generateEmbedding('testo');

        expect(mockEmbedder).toHaveBeenCalledWith('testo', {
            pooling:   'mean',
            normalize: true,
        });
    });

    it('inizializza automaticamente il modello alla prima chiamata', async () => {
        const mockEmbedder = makeMockEmbedder(make384Vector());
        (pipeline as ReturnType<typeof vi.fn>).mockResolvedValue(mockEmbedder);

        expect(adapter.isInitialized()).toBe(false);
        await adapter.generateEmbedding('auto-init');
        expect(adapter.isInitialized()).toBe(true);
    });

    it('non richiama pipeline su generateEmbedding successive', async () => {
        const mockEmbedder = makeMockEmbedder(make384Vector());
        (pipeline as ReturnType<typeof vi.fn>).mockResolvedValue(mockEmbedder);

        await adapter.generateEmbedding('prima chiamata');
        await adapter.generateEmbedding('seconda chiamata');
        await adapter.generateEmbedding('terza chiamata');

        // pipeline viene chiamata solo una volta, all'inizializzazione
        expect(pipeline).toHaveBeenCalledTimes(1);
        // l'embedder invece viene chiamato per ogni testo
        expect(mockEmbedder).toHaveBeenCalledTimes(3);
    });

    it('produce vettori di 384 dimensioni (dimensione MiniLM)', async () => {
        const fakeVector = make384Vector();
        (pipeline as ReturnType<typeof vi.fn>).mockResolvedValue(makeMockEmbedder(fakeVector));

        const result = await adapter.generateEmbedding('dimensione');

        expect(result.length).toBe(384);
    });

    it('testi diversi producono vettori diversi', async () => {
        const vector1 = make384Vector(0.1);
        const vector2 = make384Vector(0.9);
        const mockEmbedder = vi.fn()
            .mockResolvedValueOnce({ data: vector1 })
            .mockResolvedValueOnce({ data: vector2 });
        (pipeline as ReturnType<typeof vi.fn>).mockResolvedValue(mockEmbedder);

        const result1 = await adapter.generateEmbedding('testo uno');
        const result2 = await adapter.generateEmbedding('testo due');

        expect(result1[0]).toBeCloseTo(0.1, 5);
        expect(result2[0]).toBeCloseTo(0.9, 5);
        expect(result1).not.toBe(result2);
    });

    it('propaga errori dell\'embedder durante generateEmbedding', async () => {
        const failingEmbedder = vi.fn().mockRejectedValue(new Error('inference failed'));
        (pipeline as ReturnType<typeof vi.fn>).mockResolvedValue(failingEmbedder);

        await expect(adapter.generateEmbedding('testo')).rejects.toThrow('inference failed');
    });
});