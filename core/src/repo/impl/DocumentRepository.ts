import { inject, injectable } from "tsyringe";

import { Document, DocumentRow } from "../../entity/Document";
import { IntegrityStatusEnum } from "../../value-objects/IntegrityStatusEnum";
import type { IDocumentRepository } from "../IDocumentRepository";
import { DatabaseProvider, DATABASE_PROVIDER_TOKEN } from "./DatabaseProvider";
import { loadMetadata, saveMetadata } from "./MetadataHelper";
import { CreateDocumentDTO } from "../../dto/DocumentDTO";
import { Metadata } from "../../value-objects/Metadata";
import { IWordEmbedding, WORD_EMBEDDING_PORT_TOKEN } from "../IWordEmbedding";
import { SearchFilters } from "../../../../shared/domain/metadata";
import { DOCUMENT_DAO_TOKEN } from "../../dao/IDocumentDAO";
import { DocumentDAO } from "../../dao/DocumentDAO";

const METADATA_TABLE = "document_metadata";
const METADATA_FK = "document_id";

@injectable()
export class DocumentRepository implements IDocumentRepository {
  constructor(
    @inject(DOCUMENT_DAO_TOKEN)
    private readonly dao: DocumentDAO,
  ) {}

  getById(id: number): Document | null {
    return this.dao.getById(id);
  }

  getByProcessId(processId: number): Document[] {
    return this.dao.getByProcessId(processId);
  }

  getByStatus(status: IntegrityStatusEnum): Document[] {
    return this.dao.getByStatus(status);
  }

  save(document: Document): Document {
    return this.dao.save(document);
  }

  updateIntegrityStatus(id: number, status: IntegrityStatusEnum): void {
    return this.dao.updateIntegrityStatus(id, status);
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
      addMeta("DataApertura", a.dataApertura);
      addMeta("DataChiusura", a.dataChiusura);
      addMeta("Oggetto", a.procedimento?.materia);
      addMeta("Denominazione", a.procedimento?.denominazioneProcedimento);
      addMeta("TipoRuolo", a.assegnazione?.tipoAssegnazione);
      addMeta("DataInizioAssegnazione", a.assegnazione?.dataInizioAssegn);
      addMeta("DataFineAssegnazione", a.assegnazione?.dataFineAssegn);
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
