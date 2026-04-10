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

function sqliteVssPackageName(
  platformName: NodeJS.Platform,
  archName: string,
): string {
  const osName = platformName === "win32" ? "windows" : platformName;
  return `sqlite-vss-${osName}-${archName}`;
}

function loadSqliteVssExtensions(db: any): void {
  // Usiamo la tua funzione per generare il nome del pacchetto
  const packageName = sqliteVssPackageName(process.platform, process.arch);
  
  let packageDir: string;

  if (app.isPackaged) {
    // In produzione su Windows, i moduli spacchettati finiscono qui
    packageDir = path.join(
      process.resourcesPath,
      "app.asar.unpacked",
      "node_modules",
      packageName
    );
  } else {
    try {
      // In sviluppo (Fedora/DevContainer)
      const packageJsonPath = require.resolve(`${packageName}/package.json`);
      packageDir = path.dirname(packageJsonPath);
    } catch (e) {
      console.error(`[VSS] Errore: impossibile trovare il pacchetto ${packageName}`, e);
      return;
    }
  }

  // Costruiamo i percorsi delle librerie (senza .dll, better-sqlite3 lo aggiunge da solo)
  const vectorPath = path.join(packageDir, "lib", "vector0");
  const vssPath = path.join(packageDir, "lib", "vss0");

  try {
    console.log(`[VSS] Tentativo caricamento da: ${packageDir}`);
    db.loadExtension(vectorPath);
    db.loadExtension(vssPath);
    console.log("[VSS] Estensioni caricate correttamente!");
  } catch (err) {
    // Se fallisce qui su Windows, mancano quasi certamente le Visual C++ Redistributable
    console.error("[VSS] Errore fatale durante il loadExtension:", err);
  }
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
      this.configureRuntimeDatabase();

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

  private configureRuntimeDatabase(): void {
    const db = container.resolve<Database.Database>(SQLITE_DB_TOKEN);
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

  }

  private getApplicationBasePath(): string {
    // App is expected to run from the folder that also contains dip.{uuid}
    return process.cwd();
  }
}
