import Database from "better-sqlite3";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { container, inject } from "tsyringe";
import {
  INDEX_DIP_TOKEN,
  IIndexDip,
} from "../core/src/use-case/utils/indexing/IIndexDip";
import { app, webContents } from "electron";
import { IpcChannels } from "../shared/ipc-channels";
import {
  BOOTSTRAP_DIP_NOT_FOUND_MESSAGE,
  BOOTSTRAP_LOADING_STATUS,
  BootstrapStatus,
} from "../shared/bootstrap-status";

export const SQLITE_DB_TOKEN = Symbol("SqliteDatabase");
const EMBEDDING_DIMENSION = 384;

async function loadSqliteVssExtensions(db: Database.Database): Promise<boolean> {
  const dynamicImport = new Function(
    "modulePath",
    "return import(modulePath)",
  ) as (modulePath: string) => Promise<any>;
  const sqliteVss: any = await dynamicImport("sqlite-vss");
  const vectorPath = sqliteVss.getVectorLoadablePath();
  const vssPath = sqliteVss.getVssLoadablePath();

  // better-sqlite3 auto-appends platform extension suffixes.
  const stripExtension = (p: string): string =>
    p.replace(/\.(so|dylib|dll)$/, "");

  db.loadExtension(stripExtension(vectorPath));
  db.loadExtension(stripExtension(vssPath));
  console.log("[BOOTSTRAP] sqlite-vss extensions loaded successfully.");
  return true;
}

function ensureVectorSearchSchema(db: Database.Database): void {
  db.exec(
    `CREATE VIRTUAL TABLE IF NOT EXISTS document_vector_vss USING vss0(embedding(${EMBEDDING_DIMENSION}))`,
  );
}

export class ApplicationBootstrapAdapter {
  private bootstrapStatus: BootstrapStatus = BOOTSTRAP_LOADING_STATUS;

  constructor(
    @inject(INDEX_DIP_TOKEN)
    private readonly indexDip: IIndexDip,
  ) {}

  public isBootstrapCompleted(): boolean {
    return this.bootstrapStatus.state !== "loading";
  }

  public getBootstrapStatus(): BootstrapStatus {
    return this.bootstrapStatus;
  }

  public markBootstrapCompleted(status: BootstrapStatus): void {
    if (this.bootstrapStatus.state !== "loading") {
      return;
    }

    this.bootstrapStatus = status;
    webContents
      .getAllWebContents()
      .forEach((wc) => wc.send(IpcChannels.BOOTSTRAP_COMPLETE, status));
  }

  async bootstrap(dipPath: string): Promise<void> {
    try {
      const appBasePath = this.getApplicationBasePath();
      this.bootstrapDatabase(appBasePath);
      await this.configureRuntimeDatabase();

      const resolvedDipPath = path.resolve(dipPath);
      if (!existsSync(resolvedDipPath)) {
        throw new Error(`DIP directory not found: ${resolvedDipPath}`);
      }

      await this.indexDip.execute(resolvedDipPath);
      this.markBootstrapCompleted({ state: "success" });
    } catch (error) {
      const message =
        error instanceof Error &&
        error.message.startsWith("DIP directory not found:")
          ? BOOTSTRAP_DIP_NOT_FOUND_MESSAGE
          : error instanceof Error
            ? BOOTSTRAP_DIP_NOT_FOUND_MESSAGE
            : String(BOOTSTRAP_DIP_NOT_FOUND_MESSAGE);

      console.warn("[BOOTSTRAP] Skipping automatic DIP indexing:", message);
      this.markBootstrapCompleted({ state: "failure", message });
    }
  }

  bootstrapDatabase(appBasePath: string): void {
    // 1. Resolve Schema Path based on environment
    const basePath = app.isPackaged ? process.resourcesPath : appBasePath;

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

    // 2. Read and execute schema
    const schema = readFileSync(schemaPath, "utf-8");
    const db = container.resolve<Database.Database>(SQLITE_DB_TOKEN);
    db.exec(schema);

    console.log("[BOOTSTRAP] Database schema bootstrapped successfully.");
  }

  private async configureRuntimeDatabase(): Promise<void> {
    const db = container.resolve<Database.Database>(SQLITE_DB_TOKEN);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");

    try {
      const extensionsLoaded = await loadSqliteVssExtensions(db);
      if (extensionsLoaded) {
        ensureVectorSearchSchema(db);
      }
    } catch (error) {
      console.warn(
        "[BOOTSTRAP] sqlite-vss extensions not loaded; vector search disabled:",
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  private getApplicationBasePath(): string {
    // App is expected to run from the folder that also contains dip.{uuid}
    return process.cwd();
  }
}
