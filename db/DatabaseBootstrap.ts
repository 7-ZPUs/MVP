import Database from "better-sqlite3";
import { existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { container, inject } from "tsyringe";
import {
  INDEX_DIP_TOKEN,
  IIndexDip,
} from "../core/src/use-case/utils/indexing/IIndexDip";
import { app, webContents } from "electron";
import { IpcChannels } from "../shared/ipc-channels";

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
  let packageDir = path.dirname(packageJsonPath);

  if (packageDir.includes("app.asar")) {
    packageDir = packageDir.replace("app.asar", "app.asar.unpacked");
  }

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
  private bootstrapCompleted = false;

  constructor(
    @inject(INDEX_DIP_TOKEN)
    private readonly indexDip: IIndexDip,
  ) {}

  public isBootstrapCompleted(): boolean {
    return this.bootstrapCompleted;
  }

  public markBootstrapCompleted(): void {
    if (this.bootstrapCompleted) {
      return;
    }

    this.bootstrapCompleted = true;
    webContents
      .getAllWebContents()
      .forEach((wc) => wc.send(IpcChannels.BOOTSTRAP_COMPLETE));
  }

  async bootstrap(dipPath: string): Promise<void> {
    const appBasePath = this.getApplicationBasePath();
    const dbPath = this.bootstrapDatabase(appBasePath);
    this.registerRuntimeDatabase(dbPath);

    const resolvedDipPath = path.resolve(dipPath);
    if (!existsSync(resolvedDipPath)) {
      throw new Error(`DIP directory not found: ${resolvedDipPath}`);
    }

    await this.indexDip.execute(resolvedDipPath);
    this.markBootstrapCompleted();
  }

  bootstrapDatabase(appBasePath: string): string {
    // 1. Resolve Schema Path based on environment
    const basePath =
      process.env["NODE_ENV"] === "development"
        ? process.cwd()
        : process.resourcesPath;

    const schemaPath =
      process.env["NODE_ENV"] === "development"
        ? path.join(basePath, "db", "schema.sql")
        : path.join(basePath, "schema.sql");

    // Defensive check: catch packaging issues early
    if (!existsSync(schemaPath)) {
      throw new Error(
        `[BOOTSTRAP] CRITICAL: Schema not found at ${schemaPath}`,
      );
    }

    // 2. Resolve Database Path (Writable user directory)
    const dbPath = path.join(app.getPath("userData"), "dip-viewer.db");

    // Always rebuild DB from scratch before indexing.
    rmSync(dbPath, { force: true });

    // 3. Read and execute schema
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
