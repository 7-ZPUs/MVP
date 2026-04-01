/**
 * DatabaseProvider — Singleton SQLite connection.
 *
 * Tutte le repository condividono la stessa connessione per garantire
 * la consistenza dei foreign key e del WAL mode.
 */
import { injectable } from "tsyringe";
import Database from "better-sqlite3";
import * as path from "node:path";
import * as os from "node:os";
import * as fs from "node:fs";

export const DATABASE_PROVIDER_TOKEN = Symbol("DatabaseProvider");

@injectable()
export class DatabaseProvider {
  private _db: Database.Database | null = null;
  private _initPromise: Promise<Database.Database> | null = null;
  public get db(): Database.Database {
    if (!this._db) {
      throw new Error(
        "DatabaseProvider non inizializzato. Chiama await dbProvider.init() prima.",
      );
    }
    return this._db;
  }
  public init(): Promise<Database.Database> {
    if (this._initPromise) return this._initPromise;

    this._initPromise = (async () => {
      const dir = path.join(os.homedir(), ".dip-viewer");
      fs.mkdirSync(dir, { recursive: true });
      const dbPath = path.join(dir, "dip-viewer.db");

      this._db = new Database(dbPath);
      this._db.pragma("journal_mode = WAL");
      this._db.pragma("foreign_keys = ON");

      // Workaround for sqlite-vss double extension issue on Linux
      const sqliteVss = await new Function('return import("sqlite-vss")')();

      try {
        // Let sqlite-vss handle it first
        sqliteVss.load(this._db);
      } catch (err: any) {
        // If it fails with the double .so error (because better-sqlite3 auto-appends on Linux/Mac)
        if (err.message && err.message.includes(".so.so")) {
          const vectorPath = sqliteVss
            .getVectorLoadablePath()
            .replace(/\.so$/, "");
          const vssPath = sqliteVss.getVssLoadablePath().replace(/\.so$/, "");
          this._db.loadExtension(vectorPath);
          this._db.loadExtension(vssPath);
        } else {
          throw err;
        }
      }
      return this._db;
    })();

    return this._initPromise;
  }
}
