/**
 * ClasseDocumentaleRepository — Infrastructure Repository (SQLite)
 *
 * Implementa IClasseDocumentaleRepository usando better-sqlite3.
 * È responsabile esclusivamente della persistenza: zero business logic.
 *
 * Il database viene creato/aperto in modo lazy al primo utilizzo per
 * garantire compatibilità con l'inizializzazione di Electron.
 */
import { injectable } from 'tsyringe';
import Database from 'better-sqlite3';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

import type { ClasseDocumentale } from '../../entity/ClasseDocumentale';
import type { IClasseDocumentaleRepository } from '../IClasseDocumentaleRepository';
import { StatoVerificaEnum } from '../../value-objects/StatoVerificaEnum';

@injectable()
export class ClasseDocumentaleRepository implements IClasseDocumentaleRepository {
    private _db: Database.Database | null = null;

    // ---------------------------------------------------------------------------
    // Lazy DB initialisation
    // ---------------------------------------------------------------------------
    private get db(): Database.Database {
        if (!this._db) {
            // Percorso: ~/.dip-viewer/dip-viewer.db
            const dir = path.join(os.homedir(), '.dip-viewer');
            fs.mkdirSync(dir, { recursive: true });
            const dbPath = path.join(dir, 'dip-viewer.db');

            this._db = new Database(dbPath);
            this._db.pragma('journal_mode = WAL'); // migliora le performance di scrittura
            this._db.pragma('foreign_keys = ON');

            this.createSchema();
        }
        return this._db;
    }

    private createSchema(): void {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS classe_documentale (
        id    INTEGER PRIMARY KEY AUTOINCREMENT,
        nome  TEXT    NOT NULL UNIQUE,
        hash  TEXT    NOT NULL
      );
    `);
    }

    // ---------------------------------------------------------------------------
    // IClasseDocumentaleRepository implementation
    // ---------------------------------------------------------------------------

    getAll(): ClasseDocumentale[] {
        return this.db
            .prepare<[], ClasseDocumentale>('SELECT id, nome FROM classe_documentale ORDER BY nome')
            .all();
    }

    getById(id: number): ClasseDocumentale | undefined {
        return (
            this.db
                .prepare<[number], ClasseDocumentale>('SELECT id, nome FROM classe_documentale WHERE id = ?')
                .get(id) ?? undefined
        );
    }

    create(nome: string, uuid: string): ClasseDocumentale {
        const result = this.db
            .prepare<[string], Database.RunResult>('INSERT INTO classe_documentale (nome) VALUES (?)')
            .run(nome);

        return {
            id: result.lastInsertRowid as number,
            nome,
            uuid,
        };
    }

    getByStatus(stato: StatoVerificaEnum): ClasseDocumentale[] {
        return this.db
            .prepare<[StatoVerificaEnum], ClasseDocumentale>('SELECT id, nome FROM classe_documentale WHERE stato = ?')
            .all(stato);
    }

}
