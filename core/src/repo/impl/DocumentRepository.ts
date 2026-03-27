import { inject, injectable } from 'tsyringe';
import Database from 'better-sqlite3';

import { Document, DocumentRow } from '../../entity/Document';
import { IntegrityStatusEnum } from '../../value-objects/IntegrityStatusEnum';
import type { IDocumentRepository } from '../IDocumentRepository';
import { DatabaseProvider, DATABASE_PROVIDER_TOKEN } from './DatabaseProvider';
import { loadMetadata, saveMetadata } from './MetadataHelper';
import { CreateDocumentDTO } from '../../dto/DocumentDTO';
import { Metadata } from '../../value-objects/Metadata';
import { SearchFilters } from '../../../../shared/domain/metadata/search.models';
import { IWordEmbedding, WORD_EMBEDDING_PORT_TOKEN } from '../IWordEmbedding';

const METADATA_TABLE = 'document_metadata';
const METADATA_FK = 'document_id';

@injectable()
export class DocumentRepository implements IDocumentRepository {
    private readonly db: Database.Database;

    constructor(
        @inject(DATABASE_PROVIDER_TOKEN)
        private readonly dbProvider: DatabaseProvider,
        @inject(WORD_EMBEDDING_PORT_TOKEN)
        private readonly aiAdapter: IWordEmbedding
    ) {
        this.db = dbProvider.db;
        this.createSchema();
    }

    private createSchema(): void {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS document (
                id               INTEGER PRIMARY KEY AUTOINCREMENT,
                uuid             TEXT    NOT NULL UNIQUE,
                integrity_status TEXT    NOT NULL DEFAULT 'UNKNOWN',
                process_id       INTEGER
            );

            CREATE TABLE IF NOT EXISTS document_metadata (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id INTEGER NOT NULL REFERENCES document(id) ON DELETE CASCADE,
                name        TEXT    NOT NULL,
                value       TEXT    NOT NULL,
                type        TEXT    NOT NULL DEFAULT 'string'
            );

            CREATE VIRTUAL TABLE IF NOT EXISTS vss_documents
            USING vss0(embedding(384));
        `);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private rowToEntity(row: DocumentRow): Document {
        const metadata = loadMetadata(this.db, METADATA_TABLE, METADATA_FK, row.id);
        return Document.fromDB(row, metadata);
    }

    private toBuffer(vector: Float32Array): Buffer { // converte un Float32Array in Buffer per sqlite-vss
        return Buffer.from(vector.buffer);
    }

    // -------------------------------------------------------------------------
    // IDocumentRepository implementation
    // -------------------------------------------------------------------------

    getById(id: number): Document | null {
        const row = this.db
            .prepare<[number], DocumentRow>(
                `SELECT id, uuid, integrity_status as integrityStatus, process_id as processId
                 FROM document WHERE id = ?`
            )
            .get(id);
        return row ? this.rowToEntity(row) : null;
    }

    getByProcessId(processId: number): Document[] {
        const rows = this.db
            .prepare<[number], DocumentRow>(
                `SELECT id, uuid, integrity_status as integrityStatus, process_id as processId
                 FROM document WHERE process_id = ? ORDER BY id`
            )
            .all(processId);
        return rows.map((r) => this.rowToEntity(r));
    }

    getByStatus(status: IntegrityStatusEnum): Document[] {
        const rows = this.db
            .prepare<[string], DocumentRow>(
                `SELECT id, uuid, integrity_status as integrityStatus, process_id as processId
                 FROM document WHERE integrity_status = ? ORDER BY id`
            )
            .all(status);
        return rows.map((r) => this.rowToEntity(r));
    }

    save(dto: CreateDocumentDTO): Document {
        const metadata = dto.metadata.map((m) => new Metadata(m.name, m.value, m.type));

        const result = this.db
            .prepare('INSERT INTO document (uuid, integrity_status, process_id) VALUES (?, ?, ?)')
            .run(dto.uuid, IntegrityStatusEnum.UNKNOWN, dto.processId);

        const id = result.lastInsertRowid as number;
        saveMetadata(this.db, METADATA_TABLE, METADATA_FK, id, metadata);

        return Document.fromDB(
            {
                id,
                uuid: dto.uuid,
                integrityStatus: IntegrityStatusEnum.UNKNOWN,
                processId: dto.processId,
            },
            metadata
        );
    }

    updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void {
        this.db
            .prepare('UPDATE document SET integrity_status = ? WHERE id = ?')
            .run(status, id);
    }

    /* da vedere assieme a Lorenzo se va bene sta cosa */
    searchDocument(filters: SearchFilters): Document[] {
        const conditions: string[] = [];
        const values: unknown[] = [];

        const addMeta = (key: string, value: unknown) => {
            if (value === null || value === undefined) return;
            conditions.push(`
                EXISTS (
                    SELECT 1 FROM document_metadata
                    WHERE document_id = document.id
                    AND name = ?
                    AND value = ?
                )
            `);
            values.push(key, String(value));
        };

        // --- common ---
        const c = filters.common;
        if (c) {
            addMeta('tipoDocumento',            c.tipoDocumento);
            addMeta('note',                     c.note);
            addMeta('oggetto',                  c.chiaveDescrittiva?.oggetto);
            addMeta('paroleChiave',             c.chiaveDescrittiva?.paroleChiave);
            addMeta('classificazioneCodice',    c.classificazione?.codice);
            addMeta('classificazioneDescrizione', c.classificazione?.descrizione);
            addMeta('conservazione',            c.conservazione?.valore);
        }

        // --- diDai ---
        const d = filters.diDai;
        if (d) {
            addMeta('nome',                     d.nome);
            addMeta('versione',                 d.versione);
            addMeta('idPrimario',               d.idPrimario);
            addMeta('tipologia',                d.tipologia);
            addMeta('modalitaFormazione',       d.modalitaFormazione);
            addMeta('riservatezza',             d.riservatezza);
            addMeta('formato',                  d.identificativoFormato?.formato);
            addMeta('nomeProdottoCreazione',    d.identificativoFormato?.nomeProdottoCreazione);
            addMeta('versioneProdottoCreazione', d.identificativoFormato?.versioneProdottoCreazione);
            addMeta('produttoreProdottoCreazione', d.identificativoFormato?.produttoreProdottoCreazione);
            addMeta('formatoDigitalmente',      d.verifica?.formatoDigitalmente);
            addMeta('sigillatoElettr',          d.verifica?.sigillatoElettr);
            addMeta('marcaturaTemporale',       d.verifica?.marcaturaTemporale);
            addMeta('conformitaCopie',          d.verifica?.conformitaCopie);
            addMeta('tipologiaFlusso',          d.registrazione?.tipologiaFlusso);
            addMeta('tipologiaRegistro',        d.registrazione?.tipologiaRegistro);
            addMeta('dataRegistrazione',        d.registrazione?.dataRegistrazione);
            addMeta('numeroRegistrazione',      d.registrazione?.numeroRegistrazione);
            addMeta('codiceRegistro',           d.registrazione?.codiceRegistro);
        }

        // --- aggregate ---
        const a = filters.aggregate;
        if (a) {
            addMeta('tipoAggregazione',         a.tipoAggregazione);
            addMeta('idAggregazione',           a.idAggregazione);
            addMeta('tipoFascicolo',            a.tipoFascicolo);
            addMeta('dataApertura',             a.dataApertura);
            addMeta('dataChiusura',             a.dataChiusura);
            addMeta('procedimentoMateria',      a.procedimento?.materia);
            addMeta('procedimentoDenominazione', a.procedimento?.denominazioneProcedimento);
            addMeta('tipoAssegnazione',         a.assegnazione?.tipoAssegnazione);
            addMeta('dataInizioAssegn',         a.assegnazione?.dataInizioAssegn);
            addMeta('dataFineAssegn',           a.assegnazione?.dataFineAssegn);
        }

        // --- custom ---
        if (filters.custom) {
            addMeta(filters.custom.field, filters.custom.value);
        }

        if (conditions.length === 0) return [];

        const sql = `
            SELECT id, uuid,
                integrity_status as integrityStatus,
                process_id as processId
            FROM document
            WHERE ${conditions.join(' AND ')}
        `;

        const rows = this.db
            .prepare<unknown[], DocumentRow>(sql)
            .all(...values);
        return rows.map((row) => this.rowToEntity(row));
    }

    async searchDocumentSemantic( query: string ): Promise<Array<{ document: Document; score: number }>> {
        const queryVector = await this.aiAdapter.generateEmbedding(query); // genera vettore 

        const rows = this.db // interroga la tabella virtuale usando vss_search per trovare i documenti più simili al vettore di query
            .prepare<[Buffer, number], { rowid: number; distance: number }>(
                `SELECT rowid, distance
                 FROM vss_documents
                 WHERE vss_search(embedding, ?)
                 LIMIT ?`
            )
            .all(this.toBuffer(queryVector), 10); // to buffer perchè sqlite-vss si aspetta un buffer, non un Float32Array.

        return rows // per ogni risultato, recupera il documento originale usando getById e calcola un punteggio di similarità (1 - distanza)
            .map(({ rowid, distance }) => {
                const doc = this.getById(rowid);
                if (!doc) return null;
                return { document: doc, score: 1 - distance };
            })
            .filter((r): r is { document: Document; score: number } => r !== null);
    }

    getIndexedDocumentsCount(): number {
        const row = this.db
            .prepare<[], { count: number }>('SELECT count(*) as count FROM vss_documents')
            .get();
        return row?.count ?? 0;
    }
}