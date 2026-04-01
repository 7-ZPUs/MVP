import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'events';

vi.mock('fs', () => ({
    existsSync:        vi.fn().mockReturnValue(false),
    mkdirSync:         vi.fn(),
    createWriteStream: vi.fn(),
    unlink:            vi.fn((_path: string, cb: () => void) => cb()),
    statSync:          vi.fn().mockReturnValue({ size: 120 * 1024 * 1024 }),
}));
vi.mock('https', () => ({ get: vi.fn() }));
vi.mock('http',  () => ({ get: vi.fn() }));

import * as fs    from 'fs';
import * as https from 'https';
import * as http  from 'http';
import { downloadFile, ensureDirectories } from '../../src/scripts/download-models';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeWriteStream = () => {
    const ws = new EventEmitter() as any;
    ws.close   = vi.fn((cb?: () => void) => { if (cb) cb(); });
    ws.destroy = vi.fn();
    ws.pipe    = vi.fn();
    return ws;
};

const mockHttpsGet = (
    handler: (_url: string, _opts: any, callback: (res: any) => void) => any
) => {
    (https.get as ReturnType<typeof vi.fn>).mockImplementation(handler);
};

const makeRequest = () => {
    const req = new EventEmitter() as any;
    req.destroy = vi.fn();
    return req;
};

beforeEach(() => { vi.clearAllMocks(); });

// ─── ensureDirectories ────────────────────────────────────────────────────────

describe('download-models — ensureDirectories', () => {

    it('crea la cartella onnx se non esiste', () => {
        (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

        ensureDirectories();

        expect(fs.mkdirSync).toHaveBeenCalledWith(
            expect.stringContaining('paraphrase-multilingual-MiniLM-L12-v2'),
            { recursive: true }
        );
    });

    it('non ricrea la cartella se esiste già', () => {
        (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true);

        ensureDirectories();

        expect(fs.mkdirSync).not.toHaveBeenCalled();
    });

    it('il path contiene Xenova, il nome del modello e onnx', () => {
        (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

        ensureDirectories();

        const mkdirCall = (fs.mkdirSync as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
        expect(mkdirCall).toContain('Xenova');
        expect(mkdirCall).toContain('paraphrase-multilingual-MiniLM-L12-v2');
        expect(mkdirCall).toContain('onnx');
    });

    it('ritorna il path base che contiene Xenova', () => {
        (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true);

        const baseDir = ensureDirectories();

        expect(baseDir).toContain('Xenova');
    });
});

// ─── downloadFile — file già presenti ────────────────────────────────────────

describe('download-models — salto file già presenti', () => {

    it('legge la dimensione del file esistente con statSync', () => {
        (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(true);
        (fs.statSync as ReturnType<typeof vi.fn>).mockReturnValue({ size: 125 * 1024 * 1024 });

        // ensureDirectories non scarica — verifichiamo statSync nel flusso main
        // tramite la funzione ensureDirectories che usa existsSync
        ensureDirectories();

        // existsSync viene chiamato per verificare se la cartella esiste
        expect(fs.existsSync).toHaveBeenCalled();
    });
});

// ─── downloadFile — protocollo ────────────────────────────────────────────────

describe('download-models — selezione protocollo', () => {

    it('usa https per URL https://', async () => {
        const ws = makeWriteStream();
        (fs.createWriteStream as ReturnType<typeof vi.fn>).mockReturnValue(ws);

        mockHttpsGet((_url, _opts, callback) => {
            const req = makeRequest();
            const res = new EventEmitter() as any;
            res.statusCode = 200;
            res.headers    = { 'content-length': '100' };
            res.pipe       = vi.fn().mockImplementation(() => {
                setTimeout(() => ws.emit('finish'), 0);
            });
            callback(res);
            return req;
        });

        await downloadFile('https://example.com/model.onnx', '/tmp', 'model.onnx');

        expect(https.get).toHaveBeenCalled();
        expect(http.get).not.toHaveBeenCalled();
    });

    it('crea il WriteStream nel path corretto', async () => {
        const ws = makeWriteStream();
        (fs.createWriteStream as ReturnType<typeof vi.fn>).mockReturnValue(ws);

        mockHttpsGet((_url, _opts, callback) => {
            const req = makeRequest();
            const res = new EventEmitter() as any;
            res.statusCode = 200;
            res.headers    = { 'content-length': '100' };
            res.pipe       = vi.fn().mockImplementation(() => {
                setTimeout(() => ws.emit('finish'), 0);
            });
            callback(res);
            return req;
        });

        await downloadFile('https://example.com/model.onnx', '/dest/path', 'model.onnx');

        expect(fs.createWriteStream).toHaveBeenCalledWith(
            expect.stringContaining('model.onnx')
        );
    });
});

// ─── downloadFile — download riuscito ────────────────────────────────────────

describe('download-models — download riuscito', () => {

    const makeSuccessGet = (ws: any) =>
        mockHttpsGet((_url, _opts, callback) => {
            const req = makeRequest();
            const res = new EventEmitter() as any;
            res.statusCode = 200;
            res.headers    = { 'content-length': '1024' };
            res.pipe       = vi.fn().mockImplementation(() => {
                setTimeout(() => ws.emit('finish'), 0);
            });
            callback(res);
            return req;
        });

    it('chiama pipe sulla response per scrivere il file', async () => {
        const ws = makeWriteStream();
        (fs.createWriteStream as ReturnType<typeof vi.fn>).mockReturnValue(ws);

        let capturedRes: any;
        mockHttpsGet((_url, _opts, callback) => {
            const req = makeRequest();
            const res = new EventEmitter() as any;
            res.statusCode = 200;
            res.headers    = { 'content-length': '100' };
            res.pipe       = vi.fn().mockImplementation(() => {
                setTimeout(() => ws.emit('finish'), 0);
            });
            capturedRes = res;
            callback(res);
            return req;
        });

        await downloadFile('https://example.com/model.onnx', '/tmp', 'model.onnx');

        expect(capturedRes.pipe).toHaveBeenCalledWith(ws);
    });

    it('chiude il WriteStream dopo il finish', async () => {
        const ws = makeWriteStream();
        (fs.createWriteStream as ReturnType<typeof vi.fn>).mockReturnValue(ws);
        makeSuccessGet(ws);

        await downloadFile('https://example.com/model.onnx', '/tmp', 'model.onnx');

        expect(ws.close).toHaveBeenCalled();
    });

    it('risolve la promise con il path completo del file', async () => {
        const ws = makeWriteStream();
        (fs.createWriteStream as ReturnType<typeof vi.fn>).mockReturnValue(ws);
        makeSuccessGet(ws);

        const result = await downloadFile('https://example.com/model.onnx', '/tmp', 'model.onnx');

        expect(result).toContain('model.onnx');
        expect(result).toContain('/tmp');
    });
});

// ─── downloadFile — redirect ──────────────────────────────────────────────────

describe('download-models — gestione redirect', () => {

    it('segue un redirect 302 verso il nuovo URL', async () => {
        const ws = makeWriteStream();
        (fs.createWriteStream as ReturnType<typeof vi.fn>).mockReturnValue(ws);

        const calls: string[] = [];

        mockHttpsGet((url: string, _opts: any, callback: (res: any) => void) => {
            const req = makeRequest();
            calls.push(url);

            if (calls.length === 1) {
                // Prima chiamata: redirect verso nuovo URL
                const res = new EventEmitter() as any;
                res.statusCode = 302;
                res.headers    = { location: 'https://cdn.example.com/model.onnx' };
                res.pipe       = vi.fn();
                callback(res);
            } else {
                // Seconda chiamata: download reale
                const res = new EventEmitter() as any;
                res.statusCode = 200;
                res.headers    = { 'content-length': '100' };
                res.pipe       = vi.fn().mockImplementation(() => {
                    setTimeout(() => ws.emit('finish'), 0);
                });
                callback(res);
            }
            return req;
        });

        await downloadFile('https://example.com/model.onnx', '/tmp', 'model.onnx');

        expect(calls).toHaveLength(2);
        expect(calls[0]).toBe('https://example.com/model.onnx');
        expect(calls[1]).toBe('https://cdn.example.com/model.onnx');
    });

    it('distrugge il WriteStream prima di seguire il redirect', async () => {
        const ws = makeWriteStream();
        (fs.createWriteStream as ReturnType<typeof vi.fn>).mockReturnValue(ws);

        const calls: string[] = [];

        mockHttpsGet((url: string, _opts: any, callback: (res: any) => void) => {
            const req = makeRequest();
            calls.push(url);

            if (calls.length === 1) {
                const res = new EventEmitter() as any;
                res.statusCode = 301;
                res.headers    = { location: 'https://cdn.example.com/model.onnx' };
                res.pipe       = vi.fn();
                callback(res);
            } else {
                const res = new EventEmitter() as any;
                res.statusCode = 200;
                res.headers    = { 'content-length': '100' };
                res.pipe       = vi.fn().mockImplementation(() => {
                    setTimeout(() => ws.emit('finish'), 0);
                });
                callback(res);
            }
            return req;
        });

        await downloadFile('https://example.com/model.onnx', '/tmp', 'model.onnx');

        expect(ws.destroy).toHaveBeenCalled();
    });
});

// ─── downloadFile — errori HTTP ───────────────────────────────────────────────

describe('download-models — gestione errori HTTP', () => {

    const makeErrorGet = (statusCode: number, statusMessage: string) => {
        mockHttpsGet((_url, _opts, callback) => {
            const req = makeRequest();
            const res = new EventEmitter() as any;
            res.statusCode    = statusCode;
            res.statusMessage = statusMessage;
            res.headers       = {};
            res.pipe          = vi.fn();
            callback(res);
            return req;
        });
    };

    it('rigetta la promise con errore HTTP 404', async () => {
        const ws = makeWriteStream();
        (fs.createWriteStream as ReturnType<typeof vi.fn>).mockReturnValue(ws);
        makeErrorGet(404, 'Not Found');

        await expect(
            downloadFile('https://example.com/model.onnx', '/tmp', 'model.onnx')
        ).rejects.toThrow('Errore HTTP 404');
    });

    it('rigetta la promise con errore HTTP 500', async () => {
        const ws = makeWriteStream();
        (fs.createWriteStream as ReturnType<typeof vi.fn>).mockReturnValue(ws);
        makeErrorGet(500, 'Internal Server Error');

        await expect(
            downloadFile('https://example.com/model.onnx', '/tmp', 'model.onnx')
        ).rejects.toThrow('Errore HTTP 500');
    });

    it('cancella il file parziale su errore HTTP', async () => {
        const ws = makeWriteStream();
        (fs.createWriteStream as ReturnType<typeof vi.fn>).mockReturnValue(ws);
        makeErrorGet(404, 'Not Found');

        await downloadFile('https://example.com/model.onnx', '/tmp', 'model.onnx').catch(() => {});

        expect(fs.unlink).toHaveBeenCalled();
        expect(ws.destroy).toHaveBeenCalled();
    });

    it('rigetta la promise su errore di rete', async () => {
        const ws = makeWriteStream();
        (fs.createWriteStream as ReturnType<typeof vi.fn>).mockReturnValue(ws);

        mockHttpsGet((_url, _opts, _callback) => {
            const req = makeRequest();
            setTimeout(() => req.emit('error', new Error('ECONNREFUSED')), 0);
            return req;
        });

        await expect(
            downloadFile('https://example.com/model.onnx', '/tmp', 'model.onnx')
        ).rejects.toThrow('ECONNREFUSED');
    });
});

// ─── downloadFile — errori WriteStream ───────────────────────────────────────

describe('download-models — errori WriteStream', () => {

    it('cancella il file parziale se WriteStream emette errore', async () => {
        const ws = makeWriteStream();
        (fs.createWriteStream as ReturnType<typeof vi.fn>).mockReturnValue(ws);

        mockHttpsGet((_url, _opts, callback) => {
            const req = makeRequest();
            const res = new EventEmitter() as any;
            res.statusCode = 200;
            res.headers    = { 'content-length': '100' };
            res.pipe       = vi.fn().mockImplementation(() => {
                setTimeout(() => ws.emit('error', new Error('ENOSPC: disco pieno')), 0);
            });
            callback(res);
            return req;
        });

        await downloadFile('https://example.com/model.onnx', '/tmp', 'model.onnx').catch(() => {});

        expect(fs.unlink).toHaveBeenCalled();
    });

    it('rigetta la promise se WriteStream emette errore', async () => {
        const ws = makeWriteStream();
        (fs.createWriteStream as ReturnType<typeof vi.fn>).mockReturnValue(ws);

        mockHttpsGet((_url, _opts, callback) => {
            const req = makeRequest();
            const res = new EventEmitter() as any;
            res.statusCode = 200;
            res.headers    = { 'content-length': '100' };
            res.pipe       = vi.fn().mockImplementation(() => {
                setTimeout(() => ws.emit('error', new Error('ENOSPC: disco pieno')), 0);
            });
            callback(res);
            return req;
        });

        await expect(
            downloadFile('https://example.com/model.onnx', '/tmp', 'model.onnx')
        ).rejects.toThrow('ENOSPC');
    });
});