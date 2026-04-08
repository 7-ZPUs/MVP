import Database from "better-sqlite3";
import { existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { container, inject } from "tsyringe";
import {
  INDEX_DIP_TOKEN,
  IIndexDip,
} from "../core/src/use-case/utils/indexing/IIndexDip";

export const SQLITE_DB_TOKEN = Symbol("SqliteDatabase");
const EMBEDDING_DIMENSION = 384;

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

function ensureVectorSearchSchema(db: Database.Database): void {
  db.exec(
    `CREATE VIRTUAL TABLE IF NOT EXISTS document_vector_vss USING vss0(embedding(${EMBEDDING_DIMENSION}))`,
  );
}

export class ApplicationBootstrapAdapter {
  constructor(
    @inject(INDEX_DIP_TOKEN)
    private readonly indexDip: IIndexDip,
  ) {}

  async bootstrap(dipPath: string): Promise<void> {
    const appBasePath = this.getApplicationBasePath();
    const dbPath = this.bootstrapDatabase(appBasePath);
    this.registerRuntimeDatabase(dbPath);

    const resolvedDipPath = path.resolve(dipPath);
    if (!existsSync(resolvedDipPath)) {
      throw new Error(`DIP directory not found: ${resolvedDipPath}`);
    }

    await this.indexDip.execute(resolvedDipPath);
  }

  bootstrapDatabase(appBasePath: string): string {
    const schemaPath = path.join(appBasePath, "db", "schema.sql");
    const dbPath = path.join(appBasePath, "dip-viewer.db");

    // Always rebuild DB from scratch before indexing.
    rmSync(dbPath, { force: true });

    const schema = readFileSync(schemaPath, "utf-8");
    const db = new Database(dbPath);
    db.exec(schema);
    db.close();
    console.log(`[BOOTSTRAP] Database bootstrapped successfully at ${dbPath}.`);
    return dbPath;
  }

  private registerRuntimeDatabase(dbPath: string): void {
    const db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");

    try {
      loadSqliteVssExtensions(db);
      ensureVectorSearchSchema(db);
    } catch (error) {
      console.warn(
        "[BOOTSTRAP] sqlite-vss extensions not loaded; vector search disabled:",
        error instanceof Error ? error.message : String(error),
      );
    }

    container.register(SQLITE_DB_TOKEN, { useValue: db });
  }

  private getApplicationBasePath(): string {
    // App is expected to run from the folder that also contains dip.{uuid}
    return process.cwd();
  }
}
