import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('electron', () => ({ app: { isPackaged: false } }));
vi.mock('@xenova/transformers', () => ({
    pipeline: vi.fn(),
    env: {
        localModelPath: '',
        allowLocalModels: true,
        allowRemoteModels: false,
        useBrowserCache: false,
        backends: { onnx: { executionProviders: [], wasm: { numThreads: 1 } } },
    },
}));
vi.mock('node:fs', () => ({
    existsSync: vi.fn().mockReturnValue(true),
}));

import { pipeline } from '@xenova/transformers';
import * as fs from 'node:fs';
import { WordEmbedding } from '../../../src/repo/impl/WordEmbedding';

describe('WordEmbedding', () => {
    let adapter: WordEmbedding;

    beforeEach(() => {
        vi.clearAllMocks();
        adapter = new WordEmbedding();
    });

    it('isInitialized() ritorna false prima di initialize()', () => {
        expect(adapter.isInitialized()).toBe(false);
    });

    it('initialize() carica il modello e imposta initialized = true', async () => {
        const mockEmbedder = vi.fn();
        (pipeline as ReturnType<typeof vi.fn>).mockResolvedValue(mockEmbedder);

        await adapter.initialize();

        expect(pipeline).toHaveBeenCalledWith(
            'feature-extraction',
            'paraphrase-multilingual-MiniLM-L12-v2',
            { quantized: true, local_files_only: true }
        );
        expect(adapter.isInitialized()).toBe(true);
    });

    it('initialize() è idempotente — non ricarica il modello se già inizializzato', async () => {
        const mockEmbedder = vi.fn();
        (pipeline as ReturnType<typeof vi.fn>).mockResolvedValue(mockEmbedder);

        await adapter.initialize();
        await adapter.initialize();

        expect(pipeline).toHaveBeenCalledTimes(1);
    });

    it('initialize() lancia errore se la cartella modelli non esiste', async () => {
        (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

        await expect(adapter.initialize()).rejects.toThrow('[AI] Cartella modelli non trovata');
    });

    it('generateEmbedding() chiama il modello con i parametri corretti', async () => {
        const fakeData = new Float32Array([0.1, 0.2, 0.3]);
        const mockEmbedder = vi.fn().mockResolvedValue({ data: fakeData });
        (pipeline as ReturnType<typeof vi.fn>).mockResolvedValue(mockEmbedder);

        const result = await adapter.generateEmbedding('testo di prova');

        expect(mockEmbedder).toHaveBeenCalledWith('testo di prova', { pooling: 'mean', normalize: true });
        expect(result).toBe(fakeData);
    });

    it('generateEmbedding() inizializza automaticamente se non ancora inizializzato', async () => {
        const fakeData = new Float32Array([0.5]);
        const mockEmbedder = vi.fn().mockResolvedValue({ data: fakeData });
        (pipeline as ReturnType<typeof vi.fn>).mockResolvedValue(mockEmbedder);

        await adapter.generateEmbedding('auto-init');

        expect(adapter.isInitialized()).toBe(true);
    });
});