import { describe, it, expect, vi, beforeEach } from 'vitest';

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
import { SearchFilters } from '../../../../shared/domain/metadata/search.models';

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Costruisce un DatabaseProvider mock con prepare() configurabile
const makeDb = (prepareResult: Partial<{ get: any; all: any; run: any }> = {}) => {
    const stmt = {
        get: vi.fn().mockReturnValue(prepareResult.get ?? null),
        all: vi.fn().mockReturnValue(prepareResult.all ?? []),
        run: vi.fn().mockReturnValue(prepareResult.run ?? { lastInsertRowid: 1 }),
    };
    return {
        exec:    vi.fn(),
        prepare: vi.fn().mockReturnValue(stmt),
        _stmt:   stmt,
    };
};

// Costruisce un aiAdapter mock con vettore predefinito
const makeAiAdapter = (vector = new Float32Array(384).fill(0.1)): IWordEmbedding => ({
    generateEmbedding: vi.fn().mockResolvedValue(vector),
    isInitialized:     vi.fn().mockReturnValue(true),
});

// Costruisce il repository con db e aiAdapter mockati
const makeRepo = (db = makeDb(), ai = makeAiAdapter()) => {
    const repo = new DocumentRepository(
        { db } as any,
        ai
    );
    // Sostituisce prepare con una versione controllabile dopo la costruzione
    (repo as any).db = db;
    return { repo, db, ai };
};

// Filtri completamente vuoti — nessuna condizione attiva
const emptyFilters: SearchFilters = {
    common:    { chiaveDescrittiva: null, classificazione: null, conservazione: null, note: null, tipoDocumento: null },
    diDai:     { nome: null, versione: null, idPrimario: null, tipologia: null, modalitaFormazione: null, riservatezza: null, identificativoFormato: null, verifica: null, registrazione: null, tracciatureModifiche: null },
    aggregate: { tipoAggregazione: null, idAggregazione: null, tipoFascicolo: null, dataApertura: null, dataChiusura: null, procedimento: null, assegnazione: null },
    subject:   null,
    custom:    null,
};

// Riga documento SQLite di esempio
const fakeRow = { id: 1, uuid: 'doc-uuid', integrityStatus: 'UNKNOWN', processId: 1 };

// ─── searchDocument — filtri vuoti ───────────────────────────────────────────

describe('DocumentRepository.searchDocument — filtri vuoti', () => {

    it('ritorna array vuoto senza interrogare il DB se tutti i filtri sono null', () => {
        const db = makeDb();
        const { repo } = makeRepo(db);

        const results = repo.searchDocument(emptyFilters);

        expect(results).toEqual([]);
        // prepare non deve essere chiamato per la query di ricerca
        expect(db.prepare).toHaveBeenCalledTimes(0);
    });
});

// ─── searchDocument — filtri common ──────────────────────────────────────────

describe('DocumentRepository.searchDocument — filtri common', () => {

    it('filtra per tipoDocumento — genera condizione EXISTS su document_metadata', () => {
        const db = makeDb({ all: [fakeRow] });
        const { repo } = makeRepo(db);

        // Prepara loadMetadata mock
        db.prepare.mockReturnValue({ all: vi.fn().mockReturnValue([]), get: vi.fn(), run: vi.fn() });

        const filters: SearchFilters = {
            ...emptyFilters,
            common: { ...emptyFilters.common, tipoDocumento: 'DOCUMENTO INFORMATICO' as any },
        };

        repo.searchDocument(filters);

        const sql = db.prepare.mock.calls[0][0] as string;
        expect(sql).toContain('EXISTS');
        expect(sql).toContain('document_metadata');
    });

    it('filtra per note — passa la chiave corretta al prepared statement', () => {
        const db = makeDb({ all: [] });
        const { repo } = makeRepo(db);
        db.prepare.mockReturnValue({ all: vi.fn().mockReturnValue([]), get: vi.fn(), run: vi.fn() });

        const filters: SearchFilters = {
            ...emptyFilters,
            common: { ...emptyFilters.common, note: 'nota importante' },
        };

        repo.searchDocument(filters);

        // I valori passati al prepared statement devono contenere la chiave 'note' e il valore
        const stmtAll = db.prepare.mock.results[0].value.all;
        const callArgs = stmtAll.mock.calls[0] as string[];
        expect(callArgs).toContain('note');
        expect(callArgs).toContain('nota importante');
    });

    it('filtra per oggetto (chiaveDescrittiva.oggetto)', () => {
        const db = makeDb({ all: [] });
        const { repo } = makeRepo(db);
        db.prepare.mockReturnValue({ all: vi.fn().mockReturnValue([]), get: vi.fn(), run: vi.fn() });

        const filters: SearchFilters = {
            ...emptyFilters,
            common: {
                ...emptyFilters.common,
                chiaveDescrittiva: { oggetto: 'contratto vendita', paroleChiave: null },
            },
        };

        repo.searchDocument(filters);

        const stmtAll = db.prepare.mock.results[0].value.all;
        const callArgs = stmtAll.mock.calls[0] as string[];
        expect(callArgs).toContain('oggetto');
        expect(callArgs).toContain('contratto vendita');
    });

    it('filtra per paroleChiave (chiaveDescrittiva.paroleChiave)', () => {
        const db = makeDb({ all: [] });
        const { repo } = makeRepo(db);
        db.prepare.mockReturnValue({ all: vi.fn().mockReturnValue([]), get: vi.fn(), run: vi.fn() });

        const filters: SearchFilters = {
            ...emptyFilters,
            common: {
                ...emptyFilters.common,
                chiaveDescrittiva: { oggetto: null, paroleChiave: 'fattura IVA' },
            },
        };

        repo.searchDocument(filters);

        const callArgs = db.prepare.mock.results[0].value.all.mock.calls[0] as string[];
        expect(callArgs).toContain('paroleChiave');
        expect(callArgs).toContain('fattura IVA');
    });

    it('filtra per classificazioneCodice', () => {
        const db = makeDb({ all: [] });
        const { repo } = makeRepo(db);
        db.prepare.mockReturnValue({ all: vi.fn().mockReturnValue([]), get: vi.fn(), run: vi.fn() });

        const filters: SearchFilters = {
            ...emptyFilters,
            common: {
                ...emptyFilters.common,
                classificazione: { codice: '1.2.3', descrizione: null },
            },
        };

        repo.searchDocument(filters);

        const callArgs = db.prepare.mock.results[0].value.all.mock.calls[0] as string[];
        expect(callArgs).toContain('classificazioneCodice');
        expect(callArgs).toContain('1.2.3');
    });

    it('filtra per classificazioneDescrizione', () => {
        const db = makeDb({ all: [] });
        const { repo } = makeRepo(db);
        db.prepare.mockReturnValue({ all: vi.fn().mockReturnValue([]), get: vi.fn(), run: vi.fn() });

        const filters: SearchFilters = {
            ...emptyFilters,
            common: {
                ...emptyFilters.common,
                classificazione: { codice: null, descrizione: 'Contratti attivi' },
            },
        };

        repo.searchDocument(filters);

        const callArgs = db.prepare.mock.results[0].value.all.mock.calls[0] as string[];
        expect(callArgs).toContain('classificazioneDescrizione');
        expect(callArgs).toContain('Contratti attivi');
    });

    it('filtra per conservazione.valore', () => {
        const db = makeDb({ all: [] });
        const { repo } = makeRepo(db);
        db.prepare.mockReturnValue({ all: vi.fn().mockReturnValue([]), get: vi.fn(), run: vi.fn() });

        const filters: SearchFilters = {
            ...emptyFilters,
            common: {
                ...emptyFilters.common,
                conservazione: { valore: 10 },
            },
        };

        repo.searchDocument(filters);

        const callArgs = db.prepare.mock.results[0].value.all.mock.calls[0] as string[];
        expect(callArgs).toContain('conservazione');
        expect(callArgs).toContain('10');
    });

    it('filtra per più campi common contemporaneamente — genera più EXISTS', () => {
        const db = makeDb({ all: [] });
        const { repo } = makeRepo(db);
        db.prepare.mockReturnValue({ all: vi.fn().mockReturnValue([]), get: vi.fn(), run: vi.fn() });

        const filters: SearchFilters = {
            ...emptyFilters,
            common: {
                tipoDocumento:    'DOCUMENTO INFORMATICO' as any,
                note:             'nota test',
                chiaveDescrittiva: null,
                classificazione:   null,
                conservazione:     null,
            },
        };

        repo.searchDocument(filters);

        const sql = db.prepare.mock.calls[0][0] as string;
        // Conta le occorrenze di EXISTS nella query
        const existsCount = (sql.match(/EXISTS/g) ?? []).length;
        expect(existsCount).toBe(2);
    });
});

// ─── searchDocument — filtri diDai ───────────────────────────────────────────

describe('DocumentRepository.searchDocument — filtri diDai', () => {

    it('filtra per nome file', () => {
        const db = makeDb({ all: [] });
        const { repo } = makeRepo(db);
        db.prepare.mockReturnValue({ all: vi.fn().mockReturnValue([]), get: vi.fn(), run: vi.fn() });

        const filters: SearchFilters = {
            ...emptyFilters,
            diDai: { ...emptyFilters.diDai, nome: 'fattura.pdf' },
        };

        repo.searchDocument(filters);

        const callArgs = db.prepare.mock.results[0].value.all.mock.calls[0] as string[];
        expect(callArgs).toContain('nome');
        expect(callArgs).toContain('fattura.pdf');
    });

    it('filtra per versione', () => {
        const db = makeDb({ all: [] });
        const { repo } = makeRepo(db);
        db.prepare.mockReturnValue({ all: vi.fn().mockReturnValue([]), get: vi.fn(), run: vi.fn() });

        const filters: SearchFilters = {
            ...emptyFilters,
            diDai: { ...emptyFilters.diDai, versione: '2.0' },
        };

        repo.searchDocument(filters);

        const callArgs = db.prepare.mock.results[0].value.all.mock.calls[0] as string[];
        expect(callArgs).toContain('versione');
        expect(callArgs).toContain('2.0');
    });

    it('filtra per formato (identificativoFormato.formato)', () => {
        const db = makeDb({ all: [] });
        const { repo } = makeRepo(db);
        db.prepare.mockReturnValue({ all: vi.fn().mockReturnValue([]), get: vi.fn(), run: vi.fn() });

        const filters: SearchFilters = {
            ...emptyFilters,
            diDai: {
                ...emptyFilters.diDai,
                identificativoFormato: {
                    formato:                    'PDF' as any,
                    nomeProdottoCreazione:       null,
                    versioneProdottoCreazione:   null,
                    produttoreProdottoCreazione: null,
                },
            },
        };

        repo.searchDocument(filters);

        const callArgs = db.prepare.mock.results[0].value.all.mock.calls[0] as string[];
        expect(callArgs).toContain('formato');
        expect(callArgs).toContain('PDF');
    });

    it('filtra per riservatezza', () => {
        const db = makeDb({ all: [] });
        const { repo } = makeRepo(db);
        db.prepare.mockReturnValue({ all: vi.fn().mockReturnValue([]), get: vi.fn(), run: vi.fn() });

        const filters: SearchFilters = {
            ...emptyFilters,
            diDai: { ...emptyFilters.diDai, riservatezza: true },
        };

        repo.searchDocument(filters);

        const callArgs = db.prepare.mock.results[0].value.all.mock.calls[0] as string[];
        expect(callArgs).toContain('riservatezza');
        expect(callArgs).toContain('true');
    });

    it('filtra per tipologiaFlusso (registrazione.tipologiaFlusso)', () => {
        const db = makeDb({ all: [] });
        const { repo } = makeRepo(db);
        db.prepare.mockReturnValue({ all: vi.fn().mockReturnValue([]), get: vi.fn(), run: vi.fn() });

        const filters: SearchFilters = {
            ...emptyFilters,
            diDai: {
                ...emptyFilters.diDai,
                registrazione: {
                    tipologiaFlusso:      'ENTRATA' as any,
                    tipologiaRegistro:    null,
                    dataRegistrazione:    null,
                    oraRegistrazione:     null,
                    numeroRegistrazione:  null,
                    codiceRegistro:       null,
                },
            },
        };

        repo.searchDocument(filters);

        const callArgs = db.prepare.mock.results[0].value.all.mock.calls[0] as string[];
        expect(callArgs).toContain('tipologiaFlusso');
        expect(callArgs).toContain('ENTRATA');
    });

    it('filtra per marcaturaTemporale (verifica.marcaturaTemporale)', () => {
        const db = makeDb({ all: [] });
        const { repo } = makeRepo(db);
        db.prepare.mockReturnValue({ all: vi.fn().mockReturnValue([]), get: vi.fn(), run: vi.fn() });

        const filters: SearchFilters = {
            ...emptyFilters,
            diDai: {
                ...emptyFilters.diDai,
                verifica: {
                    formatoDigitalmente: null,
                    sigillatoElettr:     null,
                    marcaturaTemporale:  true,
                    conformitaCopie:     null,
                },
            },
        };

        repo.searchDocument(filters);

        const callArgs = db.prepare.mock.results[0].value.all.mock.calls[0] as string[];
        expect(callArgs).toContain('marcaturaTemporale');
        expect(callArgs).toContain('true');
    });

    it('filtra per modalitaFormazione', () => {
        const db = makeDb({ all: [] });
        const { repo } = makeRepo(db);
        db.prepare.mockReturnValue({ all: vi.fn().mockReturnValue([]), get: vi.fn(), run: vi.fn() });

        const filters: SearchFilters = {
            ...emptyFilters,
            diDai: { ...emptyFilters.diDai, modalitaFormazione: 'EX_NOVO' as any },
        };

        repo.searchDocument(filters);

        const callArgs = db.prepare.mock.results[0].value.all.mock.calls[0] as string[];
        expect(callArgs).toContain('modalitaFormazione');
        expect(callArgs).toContain('EX_NOVO');
    });

    it('filtra per nomeProdottoCreazione', () => {
        const db = makeDb({ all: [] });
        const { repo } = makeRepo(db);
        db.prepare.mockReturnValue({ all: vi.fn().mockReturnValue([]), get: vi.fn(), run: vi.fn() });

        const filters: SearchFilters = {
            ...emptyFilters,
            diDai: {
                ...emptyFilters.diDai,
                identificativoFormato: {
                    formato:                    null,
                    nomeProdottoCreazione:       'Adobe Acrobat',
                    versioneProdottoCreazione:   null,
                    produttoreProdottoCreazione: null,
                },
            },
        };

        repo.searchDocument(filters);

        const callArgs = db.prepare.mock.results[0].value.all.mock.calls[0] as string[];
        expect(callArgs).toContain('nomeProdottoCreazione');
        expect(callArgs).toContain('Adobe Acrobat');
    });
});

// ─── searchDocument — filtri aggregate ───────────────────────────────────────

describe('DocumentRepository.searchDocument — filtri aggregate', () => {

    it('filtra per tipoAggregazione', () => {
        const db = makeDb({ all: [] });
        const { repo } = makeRepo(db);
        db.prepare.mockReturnValue({ all: vi.fn().mockReturnValue([]), get: vi.fn(), run: vi.fn() });

        const filters: SearchFilters = {
            ...emptyFilters,
            aggregate: { ...emptyFilters.aggregate, tipoAggregazione: 'FASCICOLO' as any },
        };

        repo.searchDocument(filters);

        const callArgs = db.prepare.mock.results[0].value.all.mock.calls[0] as string[];
        expect(callArgs).toContain('tipoAggregazione');
        expect(callArgs).toContain('FASCICOLO');
    });

    it('filtra per idAggregazione', () => {
        const db = makeDb({ all: [] });
        const { repo } = makeRepo(db);
        db.prepare.mockReturnValue({ all: vi.fn().mockReturnValue([]), get: vi.fn(), run: vi.fn() });

        const filters: SearchFilters = {
            ...emptyFilters,
            aggregate: { ...emptyFilters.aggregate, idAggregazione: 'AGG-2026-001' },
        };

        repo.searchDocument(filters);

        const callArgs = db.prepare.mock.results[0].value.all.mock.calls[0] as string[];
        expect(callArgs).toContain('idAggregazione');
        expect(callArgs).toContain('AGG-2026-001');
    });

    it('filtra per dataApertura e dataChiusura — genera due EXISTS', () => {
        const db = makeDb({ all: [] });
        const { repo } = makeRepo(db);
        db.prepare.mockReturnValue({ all: vi.fn().mockReturnValue([]), get: vi.fn(), run: vi.fn() });

        const filters: SearchFilters = {
            ...emptyFilters,
            aggregate: {
                ...emptyFilters.aggregate,
                dataApertura: '2026-01-01' as any,
                dataChiusura: '2026-12-31' as any,
            },
        };

        repo.searchDocument(filters);

        const callArgs = db.prepare.mock.results[0].value.all.mock.calls[0] as string[];
        expect(callArgs).toContain('dataApertura');
        expect(callArgs).toContain('2026-01-01');
        expect(callArgs).toContain('dataChiusura');
        expect(callArgs).toContain('2026-12-31');
    });

    it('filtra per procedimentoMateria', () => {
        const db = makeDb({ all: [] });
        const { repo } = makeRepo(db);
        db.prepare.mockReturnValue({ all: vi.fn().mockReturnValue([]), get: vi.fn(), run: vi.fn() });

        const filters: SearchFilters = {
            ...emptyFilters,
            aggregate: {
                ...emptyFilters.aggregate,
                procedimento: {
                    materia:                     'Appalti pubblici',
                    denominazioneProcedimento:    null,
                    URICatalogo:                  null,
                    fasi:                         null,
                },
            },
        };

        repo.searchDocument(filters);

        const callArgs = db.prepare.mock.results[0].value.all.mock.calls[0] as string[];
        expect(callArgs).toContain('procedimentoMateria');
        expect(callArgs).toContain('Appalti pubblici');
    });

    it('filtra per tipoAssegnazione (assegnazione.tipoAssegnazione)', () => {
        const db = makeDb({ all: [] });
        const { repo } = makeRepo(db);
        db.prepare.mockReturnValue({ all: vi.fn().mockReturnValue([]), get: vi.fn(), run: vi.fn() });

        const filters: SearchFilters = {
            ...emptyFilters,
            aggregate: {
                ...emptyFilters.aggregate,
                assegnazione: {
                    tipoAssegnazione: 'PER COMPETENZA' as any,
                    soggettoAssegn:   null,
                    dataInizioAssegn: null,
                    dataFineAssegn:   null,
                },
            },
        };

        repo.searchDocument(filters);

        const callArgs = db.prepare.mock.results[0].value.all.mock.calls[0] as string[];
        expect(callArgs).toContain('tipoAssegnazione');
        expect(callArgs).toContain('PER COMPETENZA');
    });

    it('filtra per dataInizioAssegn e dataFineAssegn', () => {
        const db = makeDb({ all: [] });
        const { repo } = makeRepo(db);
        db.prepare.mockReturnValue({ all: vi.fn().mockReturnValue([]), get: vi.fn(), run: vi.fn() });

        const filters: SearchFilters = {
            ...emptyFilters,
            aggregate: {
                ...emptyFilters.aggregate,
                assegnazione: {
                    tipoAssegnazione: null,
                    soggettoAssegn:   null,
                    dataInizioAssegn: '2026-01-01' as any,
                    dataFineAssegn:   '2026-06-30' as any,
                },
            },
        };

        repo.searchDocument(filters);

        const callArgs = db.prepare.mock.results[0].value.all.mock.calls[0] as string[];
        expect(callArgs).toContain('dataInizioAssegn');
        expect(callArgs).toContain('dataFineAssegn');
    });
});

// ─── searchDocument — filtri custom ──────────────────────────────────────────

describe('DocumentRepository.searchDocument — filtri custom', () => {

    it('filtra per campo custom con chiave e valore arbitrari', () => {
        const db = makeDb({ all: [] });
        const { repo } = makeRepo(db);
        db.prepare.mockReturnValue({ all: vi.fn().mockReturnValue([]), get: vi.fn(), run: vi.fn() });

        const filters: SearchFilters = {
            ...emptyFilters,
            custom: { field: 'campoPersonalizzato', value: 'valoreTest' },
        };

        repo.searchDocument(filters);

        const callArgs = db.prepare.mock.results[0].value.all.mock.calls[0] as string[];
        expect(callArgs).toContain('campoPersonalizzato');
        expect(callArgs).toContain('valoreTest');
    });

    it('ignora filtro custom se value è null', () => {
        const db = makeDb({ all: [] });
        const { repo } = makeRepo(db);

        const filters: SearchFilters = {
            ...emptyFilters,
            custom: { field: 'campoVuoto', value: null },
        };

        // Nessuna condizione generata → array vuoto senza query
        const results = repo.searchDocument(filters);
        expect(results).toEqual([]);
        expect(db.prepare).toHaveBeenCalledTimes(0);
    });
});

// ─── searchDocument — filtri combinati ───────────────────────────────────────

describe('DocumentRepository.searchDocument — filtri combinati', () => {

    it('combina filtri common + diDai — genera EXISTS per entrambi', () => {
        const db = makeDb({ all: [] });
        const { repo } = makeRepo(db);
        db.prepare.mockReturnValue({ all: vi.fn().mockReturnValue([]), get: vi.fn(), run: vi.fn() });

        const filters: SearchFilters = {
            ...emptyFilters,
            common: { ...emptyFilters.common, tipoDocumento: 'DOCUMENTO INFORMATICO' as any },
            diDai:  { ...emptyFilters.diDai,  nome: 'contratto.pdf' },
        };

        repo.searchDocument(filters);

        const callArgs = db.prepare.mock.results[0].value.all.mock.calls[0] as string[];
        expect(callArgs).toContain('tipoDocumento');
        expect(callArgs).toContain('nome');
    });

    it('combina filtri diDai + aggregate — genera EXISTS per entrambi', () => {
        const db = makeDb({ all: [] });
        const { repo } = makeRepo(db);
        db.prepare.mockReturnValue({ all: vi.fn().mockReturnValue([]), get: vi.fn(), run: vi.fn() });

        const filters: SearchFilters = {
            ...emptyFilters,
            diDai:     { ...emptyFilters.diDai, nome: 'verbale.pdf' },
            aggregate: { ...emptyFilters.aggregate, tipoAggregazione: 'FASCICOLO' as any },
        };

        repo.searchDocument(filters);

        const callArgs = db.prepare.mock.results[0].value.all.mock.calls[0] as string[];
        expect(callArgs).toContain('nome');
        expect(callArgs).toContain('tipoAggregazione');
    });

    it('combina common + diDai + aggregate + custom — genera EXISTS per tutti', () => {
        const db = makeDb({ all: [] });
        const { repo } = makeRepo(db);
        db.prepare.mockReturnValue({ all: vi.fn().mockReturnValue([]), get: vi.fn(), run: vi.fn() });

        const filters: SearchFilters = {
            common:    { ...emptyFilters.common, note: 'nota' },
            diDai:     { ...emptyFilters.diDai,  nome: 'doc.pdf' },
            aggregate: { ...emptyFilters.aggregate, idAggregazione: 'AGG-001' },
            subject:   null,
            custom:    { field: 'campoExtra', value: 'extra' },
        };

        repo.searchDocument(filters);

        const callArgs = db.prepare.mock.results[0].value.all.mock.calls[0] as string[];
        expect(callArgs).toContain('note');
        expect(callArgs).toContain('nome');
        expect(callArgs).toContain('idAggregazione');
        expect(callArgs).toContain('campoExtra');
    });
});

// ─── getIndexedDocumentsCount ─────────────────────────────────────────────────

describe('DocumentRepository.getIndexedDocumentsCount', () => {

    it('ritorna il conteggio dalla tabella vss_documents', () => {
        const db = makeDb({ get: { count: 42 } });
        const { repo } = makeRepo(db);
        db.prepare.mockReturnValue({ get: vi.fn().mockReturnValue({ count: 42 }), all: vi.fn(), run: vi.fn() });

        const count = repo.getIndexedDocumentsCount();

        expect(count).toBe(42);
    });

    it('ritorna 0 se la tabella è vuota', () => {
        const db = makeDb({ get: { count: 0 } });
        const { repo } = makeRepo(db);
        db.prepare.mockReturnValue({ get: vi.fn().mockReturnValue({ count: 0 }), all: vi.fn(), run: vi.fn() });

        const count = repo.getIndexedDocumentsCount();

        expect(count).toBe(0);
    });

    it('ritorna 0 se la query non ritorna righe', () => {
        const db = makeDb();
        const { repo } = makeRepo(db);
        db.prepare.mockReturnValue({ get: vi.fn().mockReturnValue(undefined), all: vi.fn(), run: vi.fn() });

        const count = repo.getIndexedDocumentsCount();

        expect(count).toBe(0);
    });
});

// ─── toBuffer ────────────────────────────────────────────────────────────────

describe('DocumentRepository.toBuffer (private via searchDocumentSemantic)', () => {

    it('converte Float32Array in Buffer con gli stessi byte', async () => {
        const vector = new Float32Array([0.1, 0.2, 0.3, 0.4]);
        const ai = makeAiAdapter(vector);
        const db = makeDb({ all: [] });
        const { repo } = makeRepo(db, ai);

        // prepare per la query VSS
        db.prepare.mockReturnValue({ all: vi.fn().mockReturnValue([]), get: vi.fn(), run: vi.fn() });

        await repo.searchDocumentSemantic('test');

        // Il buffer passato a sqlite-vss deve avere gli stessi byte del Float32Array
        const bufferArg = db.prepare.mock.results[0].value.all.mock.calls[0][0] as Buffer;
        expect(Buffer.isBuffer(bufferArg)).toBe(true);
        expect(bufferArg.byteLength).toBe(vector.byteLength);

        // Verifica che i byte siano identici
        const recovered = new Float32Array(bufferArg.buffer, bufferArg.byteOffset, bufferArg.byteLength / 4);
        expect(recovered[0]).toBeCloseTo(0.1, 5);
        expect(recovered[1]).toBeCloseTo(0.2, 5);
    });

    it('il buffer ha la stessa lunghezza in byte del Float32Array originale', async () => {
        const vector = new Float32Array(384).fill(0.5);
        const ai = makeAiAdapter(vector);
        const db = makeDb({ all: [] });
        const { repo } = makeRepo(db, ai);
        db.prepare.mockReturnValue({ all: vi.fn().mockReturnValue([]), get: vi.fn(), run: vi.fn() });

        await repo.searchDocumentSemantic('test 384');

        const bufferArg = db.prepare.mock.results[0].value.all.mock.calls[0][0] as Buffer;
        // Float32Array da 384 elementi = 384 * 4 = 1536 byte
        expect(bufferArg.byteLength).toBe(384 * 4);
    });
});

// ─── searchDocumentSemantic ───────────────────────────────────────────────────

describe('DocumentRepository.searchDocumentSemantic', () => {

    it('genera embedding dalla query e lo passa a sqlite-vss', async () => {
        const vector = new Float32Array(384).fill(0.1);
        const ai = makeAiAdapter(vector);
        const db = makeDb({ all: [] });
        const { repo } = makeRepo(db, ai);
        db.prepare.mockReturnValue({ all: vi.fn().mockReturnValue([]), get: vi.fn(), run: vi.fn() });

        await repo.searchDocumentSemantic('query test');

        expect(ai.generateEmbedding).toHaveBeenCalledWith('query test');
    });

    it('ritorna array vuoto se vss_documents non ha risultati', async () => {
        const ai = makeAiAdapter();
        const db = makeDb({ all: [] });
        const { repo } = makeRepo(db, ai);
        db.prepare.mockReturnValue({ all: vi.fn().mockReturnValue([]), get: vi.fn(), run: vi.fn() });

        const results = await repo.searchDocumentSemantic('query senza risultati');

        expect(results).toEqual([]);
    });

    it('calcola score come 1 - distance', async () => {
        const ai = makeAiAdapter();
        const db = makeDb();
        const { repo } = makeRepo(db, ai);

        // Prima chiamata: query VSS → ritorna rowid con distance
        const vssStmt = { all: vi.fn().mockReturnValue([{ rowid: 1, distance: 0.3 }]), get: vi.fn(), run: vi.fn() };
        // Seconda chiamata: getById → ritorna la riga documento
        const docStmt = { get: vi.fn().mockReturnValue(fakeRow), all: vi.fn(), run: vi.fn() };
        // Terza chiamata: loadMetadata → ritorna array vuoto
        const metaStmt = { all: vi.fn().mockReturnValue([]), get: vi.fn(), run: vi.fn() };

        db.prepare
            .mockReturnValueOnce(vssStmt)
            .mockReturnValueOnce(docStmt)
            .mockReturnValueOnce(metaStmt);

        const results = await repo.searchDocumentSemantic('query');

        expect(results).toHaveLength(1);
        expect(results[0].score).toBeCloseTo(0.7, 5); // 1 - 0.3
    });

    it('filtra i documenti non trovati da getById (null safety)', async () => {
        const ai = makeAiAdapter();
        const db = makeDb();
        const { repo } = makeRepo(db, ai);

        // VSS ritorna due rowid ma getById ritorna null per il secondo
        const vssStmt = { all: vi.fn().mockReturnValue([{ rowid: 1, distance: 0.1 }, { rowid: 99, distance: 0.2 }]), get: vi.fn(), run: vi.fn() };
        const docStmt1 = { get: vi.fn().mockReturnValue(fakeRow),  all: vi.fn(), run: vi.fn() };
        const metaStmt1 = { all: vi.fn().mockReturnValue([]), get: vi.fn(), run: vi.fn() };
        const docStmt2 = { get: vi.fn().mockReturnValue(null), all: vi.fn(), run: vi.fn() };

        db.prepare
            .mockReturnValueOnce(vssStmt)
            .mockReturnValueOnce(docStmt1)
            .mockReturnValueOnce(metaStmt1)
            .mockReturnValueOnce(docStmt2);

        const results = await repo.searchDocumentSemantic('query');

        // Solo il documento trovato deve essere nel risultato
        expect(results).toHaveLength(1);
        expect(results[0].document.getUuid()).toBe('doc-uuid');
    });

    it('passa il limite di 10 risultati a sqlite-vss', async () => {
        const ai = makeAiAdapter();
        const db = makeDb({ all: [] });
        const { repo } = makeRepo(db, ai);
        db.prepare.mockReturnValue({ all: vi.fn().mockReturnValue([]), get: vi.fn(), run: vi.fn() });

        await repo.searchDocumentSemantic('query');

        const callArgs = db.prepare.mock.results[0].value.all.mock.calls[0];
        expect(callArgs[1]).toBe(10);
    });
});