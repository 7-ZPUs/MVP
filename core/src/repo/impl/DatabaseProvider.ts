/**
 
DatabaseProvider — Singleton SQLite connection.*
Tutte le repository condividono la stessa connessione per garantire
la consistenza dei foreign key e del WAL mode.*/
import { injectable } from "tsyringe";
import Database from "better-sqlite3";
import * as path from "node:path";
import * as os from "node:os";
import * as fs from "node:fs";

function sqliteVssPackageName(
  platformName: NodeJS.Platform,
  archName: string,
): string {
  const osName = platformName === "win32" ? "windows" : platformName;
  return `sqlite-vss-${osName}-${archName}`;
}

function loadSqliteVssExtensions(db: Database.Database): void {
  const packageName = sqliteVssPackageName(process.platform, process.arch);
  const packageJsonPath = require.resolve(`${packageName}/package.json`);
  const packageDir = path.dirname(packageJsonPath);
  const vectorPath = path.join(packageDir, "lib", "vector0");
  const vssPath = path.join(packageDir, "lib", "vss0");

  db.loadExtension(vectorPath);
  db.loadExtension(vssPath);
}

export const DATABASE_PROVIDER_TOKEN = Symbol("DatabaseProvider");

@injectable()
export class DatabaseProvider {
  private _db: Database.Database | null = null;
  private readonly dbPath: string;

  constructor(dbPath?: string) {
    if (typeof dbPath === "string" && dbPath.trim().length > 0) {
      this.dbPath = dbPath;
      return;
    }

    const dir = path.join(os.homedir(), ".dip-viewer");
    this.dbPath = path.join(dir, "dip-viewer.db");
  }

  public getDb(): Database.Database {
    if (!this._db) {
      const dir = path.dirname(this.dbPath);
      fs.mkdirSync(dir, { recursive: true });

      this._db = new Database(this.dbPath);
      this._db.pragma("journal_mode = WAL");
      this._db.pragma("foreign_keys = ON");
      try {
        loadSqliteVssExtensions(this._db);
      } catch (err) {
        console.warn(
          "[DatabaseProvider] sqlite-vss extensions not loaded; vector search disabled:",
          err instanceof Error ? err.message : String(err),
        );
      }
      return this._db;
    }
    return this._db;
  }
}
