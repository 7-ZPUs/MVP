import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchDocumentsUC } from '../../../src/use-case/document/impl/SearchDocumentsUC';
import { SearchSemanticUC } from '../../../src/use-case/document/impl/SearchSemanticUC';
import { IDocumentRepository } from '../../../src/repo/IDocumentRepository';
import { Document } from '../../../src/entity/Document';
import { SearchFilters } from '../../../../shared/domain/metadata/search.models';

const makeDocument = (uuid: string, metadata: { name: string; value: string }[] = []) => {
    const meta = metadata.map(m => ({ name: m.name, value: m.value, type: 'string' as const, toDTO: () => m }));
    const doc = Document.fromDB({ id: 1, uuid, integrityStatus: 'UNKNOWN', processId: 1 }, meta as any);
    return doc;
};

const emptyFilters: SearchFilters = {
    common:    { chiaveDescrittiva: null, classificazione: null, conservazione: null, note: null, tipoDocumento: null },
    diDai:     { nome: null, versione: null, idPrimario: null, tipologia: null, modalitaFormazione: null, riservatezza: null, identificativoFormato: null, verifica: null, registrazione: null, tracciatureModifiche: null },
    aggregate: { tipoAggregazione: null, idAggregazione: null, tipoFascicolo: null, dataApertura: null, dataChiusura: null, procedimento: null, assegnazione: null },
    subject:   null,
    custom:    null,
};

describe('SearchDocumentsUC', () => {
    let repo: Pick<IDocumentRepository, 'searchDocument'>;

    beforeEach(() => {
        repo = { searchDocument: vi.fn() };
    });

    it('restituisce SearchResult[] mappando uuid e metadati', async () => {
        const doc = makeDocument('uuid-1', [
            { name: 'nome', value: 'fattura.pdf' },
            { name: 'tipoDocumento', value: 'DOCUMENTO INFORMATICO' },
        ]);
        (repo.searchDocument as ReturnType<typeof vi.fn>).mockReturnValue([doc]);

        const uc = new SearchDocumentsUC(repo as IDocumentRepository);
        const results = await uc.execute(emptyFilters);

        expect(results).toHaveLength(1);
        expect(results[0].documentId).toBe('uuid-1');
        expect(results[0].name).toBe('fattura.pdf');
        expect(results[0].type).toBe('DOCUMENTO INFORMATICO');
        expect(results[0].score).toBeNull();
    });

    it('restituisce array vuoto se il repo non trova nulla', async () => {
        (repo.searchDocument as ReturnType<typeof vi.fn>).mockReturnValue([]);

        const uc = new SearchDocumentsUC(repo as IDocumentRepository);
        const results = await uc.execute(emptyFilters);

        expect(results).toHaveLength(0);
    });

    it('usa stringa vuota per name e type se i metadati mancano', async () => {
        const doc = makeDocument('uuid-2', []);
        (repo.searchDocument as ReturnType<typeof vi.fn>).mockReturnValue([doc]);

        const uc = new SearchDocumentsUC(repo as IDocumentRepository);
        const results = await uc.execute(emptyFilters);

        expect(results[0].name).toBe('');
        expect(results[0].type).toBe('');
    });

    it('passa i filtri al repository', async () => {
        (repo.searchDocument as ReturnType<typeof vi.fn>).mockReturnValue([]);

        const filters = { ...emptyFilters, common: { ...emptyFilters.common, tipoDocumento: 'DOCUMENTO INFORMATICO' as any } };
        const uc = new SearchDocumentsUC(repo as IDocumentRepository);
        await uc.execute(filters);

        expect(repo.searchDocument).toHaveBeenCalledWith(filters);
    });
});

describe('SearchSemanticUC', () => {
    let repo: Pick<IDocumentRepository, 'searchDocumentSemantic'>;

    beforeEach(() => {
        repo = { searchDocumentSemantic: vi.fn() };
    });

    it('restituisce SearchResult[] con score', async () => {
        const doc = makeDocument('uuid-3', [
            { name: 'nome', value: 'contratto.pdf' },
            { name: 'tipoDocumento', value: 'DOCUMENTO AMMINISTRATIVO INFORMATICO' },
        ]);
        (repo.searchDocumentSemantic as ReturnType<typeof vi.fn>).mockResolvedValue([
            { document: doc, score: 0.92 },
        ]);

        const uc = new SearchSemanticUC(repo as IDocumentRepository);
        const results = await uc.execute('contratto');

        expect(results).toHaveLength(1);
        expect(results[0].documentId).toBe('uuid-3');
        expect(results[0].name).toBe('contratto.pdf');
        expect(results[0].score).toBe(0.92);
    });

    it('restituisce array vuoto se nessun documento simile', async () => {
        (repo.searchDocumentSemantic as ReturnType<typeof vi.fn>).mockResolvedValue([]);

        const uc = new SearchSemanticUC(repo as IDocumentRepository);
        const results = await uc.execute('query senza risultati');

        expect(results).toHaveLength(0);
    });

    it('passa la query al repository', async () => {
        (repo.searchDocumentSemantic as ReturnType<typeof vi.fn>).mockResolvedValue([]);

        const uc = new SearchSemanticUC(repo as IDocumentRepository);
        await uc.execute('test query');

        expect(repo.searchDocumentSemantic).toHaveBeenCalledWith('test query');
    });
});