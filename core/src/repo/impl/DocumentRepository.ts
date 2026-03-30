import { inject, injectable } from "tsyringe";
import Database from "better-sqlite3";

import { Document, DocumentRow } from "../../entity/Document";
import { IntegrityStatusEnum } from "../../value-objects/IntegrityStatusEnum";
import type { IDocumentRepository } from "../IDocumentRepository";
import { DatabaseProvider, DATABASE_PROVIDER_TOKEN } from "./DatabaseProvider";
import { loadMetadata, saveMetadata } from "./MetadataHelper";
import { CreateDocumentDTO } from "../../dto/DocumentDTO";
import { Metadata } from "../../value-objects/Metadata";
import { IWordEmbedding, WORD_EMBEDDING_PORT_TOKEN } from "../IWordEmbedding";
import { SearchFilters } from "../../../../shared/domain/metadata";

const METADATA_TABLE = "document_metadata";
const METADATA_FK = "document_id";

@injectable()
export class DocumentRepository implements IDocumentRepository {
  private readonly db: Database.Database;

  constructor(
    @inject(DATABASE_PROVIDER_TOKEN)
    private readonly dbProvider: DatabaseProvider,
    @inject(WORD_EMBEDDING_PORT_TOKEN)
    private readonly aiAdapter: IWordEmbedding,
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
                process_id       INTEGER NOT NULL REFERENCES process(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS document_metadata (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id INTEGER NOT NULL REFERENCES document(id) ON DELETE CASCADE,
                name        TEXT    NOT NULL,
                value       TEXT    NOT NULL,
                type        TEXT    NOT NULL DEFAULT 'string'
            );
        `);
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private rowToEntity(row: DocumentRow): Document {
    const metadata = loadMetadata(this.db, METADATA_TABLE, METADATA_FK, row.id);
    return Document.fromDB(row, metadata);
  }

  private toBuffer(vector: Float32Array): Buffer {
    // converte un Float32Array in Buffer per sqlite-vss
    return Buffer.from(vector.buffer);
  }

  // -------------------------------------------------------------------------
  // IDocumentRepository implementation
  // -------------------------------------------------------------------------

  getById(id: number): Document | null {
    const row = this.db
      .prepare<[number], DocumentRow>(
        `SELECT id, uuid, integrity_status as integrityStatus, process_id as processId
                 FROM document WHERE id = ?`,
      )
      .get(id);
    return row ? this.rowToEntity(row) : null;
  }

  getByProcessId(processId: number): Document[] {
    const rows = this.db
      .prepare<[number], DocumentRow>(
        `SELECT id, uuid, integrity_status as integrityStatus, process_id as processId
                 FROM document WHERE process_id = ? ORDER BY id`,
      )
      .all(processId);
    return rows.map((r) => this.rowToEntity(r));
  }

  getByStatus(status: IntegrityStatusEnum): Document[] {
    const rows = this.db
      .prepare<[string], DocumentRow>(
        `SELECT id, uuid, integrity_status as integrityStatus, process_id as processId
                 FROM document WHERE integrity_status = ? ORDER BY id`,
      )
      .all(status);
    return rows.map((r) => this.rowToEntity(r));
  }

  save(document: Document): Document {
    const metadata = document.getMetadata();

    const result = this.db
      .prepare(
        "INSERT INTO document (uuid, integrity_status, process_id) VALUES (?, ?, ?)",
      )
      .run(
        document.getUuid(),
        IntegrityStatusEnum.UNKNOWN,
        document.getProcessId(),
      );

    const id = result.lastInsertRowid as number;
    saveMetadata(this.db, METADATA_TABLE, METADATA_FK, id, metadata);

    return Document.fromDB(
      {
        id,
        uuid: document.getUuid(),
        integrityStatus: IntegrityStatusEnum.UNKNOWN,
        processId: document.getProcessId(),
      },
      metadata,
    );
  }

  updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void {
    this.db
      .prepare("UPDATE document SET integrity_status = ? WHERE id = ?")
      .run(status, id);
  }

  getAggregatedIntegrityStatusByProcessId(processId: number): IntegrityStatusEnum {
    const row = this.db
      .prepare<[number], { total: number; invalidCount: number; unknownCount: number }>(
        `SELECT
                    COUNT(*) AS total,
                    SUM(CASE WHEN integrity_status = 'INVALID' THEN 1 ELSE 0 END) AS invalidCount,
                    SUM(CASE WHEN integrity_status = 'UNKNOWN' THEN 1 ELSE 0 END) AS unknownCount
                 FROM document
                 WHERE process_id = ?`
      )
      .get(processId);

    const total = row?.total ?? 0;
    const invalidCount = row?.invalidCount ?? 0;
    const unknownCount = row?.unknownCount ?? 0;

    if (!total) {
      return IntegrityStatusEnum.UNKNOWN;
    }

    if (invalidCount) {
      return IntegrityStatusEnum.INVALID;
    }

    if (unknownCount) {
      return IntegrityStatusEnum.UNKNOWN;
    }

    return IntegrityStatusEnum.VALID;
  }

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
      addMeta("TipologiaDocumentale", c.tipoDocumento);
      addMeta("Note", c.note);
      addMeta("ChiaveDescrittiva", c.chiaveDescrittiva?.oggetto);
      addMeta("ParoleChiave", c.chiaveDescrittiva?.paroleChiave);
      addMeta("IndiceDiClassificazione", c.classificazione?.codice);
      addMeta("Descrizione", c.classificazione?.descrizione);
      addMeta("TempoDiConservazione", c.conservazione?.valore);
    }

    // --- diDai ---
    const d = filters.diDai;
    if (d) {
      addMeta("NomeDelDocumento", d.nome);
      addMeta("VersioneDelDocumento", d.versione);
      addMeta("IdIdentificativoDocumentoPrimario", d.idPrimario);
      addMeta("TipologiaDocumentale", d.tipologia);
      addMeta("ModalitaDiFormazione", d.modalitaFormazione);
      addMeta("Riservato", d.riservatezza);
      addMeta("Formato", d.identificativoFormato?.formato);
      addMeta("NomeProdotto", d.identificativoFormato?.nomeProdottoCreazione);
      addMeta(
        "VersioneProdotto",
        d.identificativoFormato?.versioneProdottoCreazione,
      );
      addMeta(
        "Produttore",
        d.identificativoFormato?.produttoreProdottoCreazione,
      );
      addMeta("FirmatoDigitalmente", d.verifica?.formatoDigitalmente);
      addMeta("SigillatoElettronicamente", d.verifica?.sigillatoElettr);
      addMeta("MarcaturaTemporale", d.verifica?.marcaturaTemporale);
      addMeta(
        "ConformitaCopieImmagineSuSupportoInformatico",
        d.verifica?.conformitaCopie,
      );
      addMeta("TipologiaDiFlusso", d.registrazione?.tipologiaFlusso);
      addMeta("TipoRegistro", d.registrazione?.tipologiaRegistro);
      addMeta("DataRegistrazioneDocumento", d.registrazione?.dataRegistrazione);
      addMeta(
        "NumeroRegistrazioneDocumento",
        d.registrazione?.numeroRegistrazione,
      );
      addMeta("CodiceRegistro", d.registrazione?.codiceRegistro);
    }

    // --- aggregate ---
    const a = filters.aggregate;
    if (a) {
      addMeta("TipoAggregazione", a.tipoAggregazione);
      addMeta("IdAggregazione", a.idAggregazione);
      addMeta("TipoAgg", a.tipoFascicolo);
      addMeta("DataDocumento", a.dataApertura); // da controllare con lore se giusto
      addMeta("DataRegistrazioneDocumento", a.dataChiusura); // da controllare con lore se giusto
      addMeta("Oggetto", a.procedimento?.materia);
      addMeta("Denominazione", a.procedimento?.denominazioneProcedimento);
      addMeta("TipoRuolo", a.assegnazione?.tipoAssegnazione);
      addMeta("DataProtocollazioneDocumento", a.assegnazione?.dataInizioAssegn); // da controllare con lore se giusto
      addMeta("OraProtocollazioneDocumento", a.assegnazione?.dataFineAssegn); // da controllare con lore se giusto
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
            WHERE ${conditions.join(" AND ")}
        `;

    const rows = this.db.prepare<unknown[], DocumentRow>(sql).all(...values);
    return rows.map((row) => this.rowToEntity(row));
  }

  async searchDocumentSemantic(
    query: string,
  ): Promise<Array<{ document: Document; score: number }>> {
    const queryVector = await this.aiAdapter.generateEmbedding(query); // genera vettore

    const rows = this.db // interroga la tabella virtuale usando vss_search per trovare i documenti più simili al vettore di query
      .prepare<[Buffer, number], { rowid: number; distance: number }>(
        `SELECT rowid, distance
                 FROM vss_documents
                 WHERE vss_search(embedding, ?)
                 LIMIT ?`,
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
      .prepare<
        [],
        { count: number }
      >("SELECT count(*) as count FROM vss_documents")
      .get();
    return row?.count ?? 0;
  }
}
