/**
 
DatabaseProvider — Singleton SQLite connection.*
Tutte le repository condividono la stessa connessione per garantire
la consistenza dei foreign key e del WAL mode.*/
import { injectable } from "tsyringe";
import Database from "better-sqlite3";
import * as path from "node:path";
import * as os from "node:os";
import * as fs from "node:fs";

export const DATABASE_PROVIDER_TOKEN = Symbol("DatabaseProvider");

@injectable()
export class DatabaseProvider {
  private _db: Database.Database | null = null;
  private readonly _dbPath: string | undefined;

  constructor(dbPath?: string) {
    this._dbPath = dbPath;
  }

  public get db(): Database.Database {
    if (!this._db) {
      let dbPath: string;
      if (typeof this._dbPath === "string") {
        dbPath = this._dbPath;
      } else {
        const dir = path.join(os.homedir(), ".dip-viewer");
        fs.mkdirSync(dir, { recursive: true });
        dbPath = path.join(dir, "dip-viewer.db");
      }
      const dir = path.dirname(dbPath);
      fs.mkdirSync(dir, { recursive: true });

      this._db = new Database(dbPath);
      this._db.pragma("journal_mode = WAL");
      this._db.pragma("foreign_keys = ON");
    }
    return this._db;
  }
}
