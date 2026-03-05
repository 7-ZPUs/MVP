/**
 * PersonaSqliteRepository — Outbound Adapter (SQLite)
 *
 * Implementa IPersonaRepository usando better-sqlite3.
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
import type { Persona } from '../../../domain/entities/Persona';
import type { IPersonaRepository } from '../../../domain/ports/outbound/IPersonaRepository';

@injectable()
export class PersonaSqliteRepository implements IPersonaRepository {
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
      CREATE TABLE IF NOT EXISTS persona (
        id      INTEGER PRIMARY KEY AUTOINCREMENT,
        nome    TEXT    NOT NULL,
        cognome TEXT    NOT NULL
      );
    `);
    }

    // ---------------------------------------------------------------------------
    // IPersonaRepository implementation
    // ---------------------------------------------------------------------------

    findAll(): Persona[] {
        return this.db
            .prepare<[], Persona>('SELECT id, nome, cognome FROM persona ORDER BY cognome, nome')
            .all();
    }

    findById(id: number): Persona | undefined {
        return (
            this.db
                .prepare<[number], Persona>('SELECT id, nome, cognome FROM persona WHERE id = ?')
                .get(id) ?? undefined
        );
    }

    create(nome: string, cognome: string): Persona {
        const info = this.db
            .prepare('INSERT INTO persona (nome, cognome) VALUES (?, ?)')
            .run(nome, cognome);
        return { id: info.lastInsertRowid as number, nome, cognome };
    }

    update(id: number, nome: string, cognome: string): Persona | undefined {
        const info = this.db
            .prepare('UPDATE persona SET nome = ?, cognome = ? WHERE id = ?')
            .run(nome, cognome, id);
        if (info.changes === 0) return undefined;
        return { id, nome, cognome };
    }

    delete(id: number): boolean {
        const info = this.db.prepare('DELETE FROM persona WHERE id = ?').run(id);
        return info.changes > 0;
    }
}
