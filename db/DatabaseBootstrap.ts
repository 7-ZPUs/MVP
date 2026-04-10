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
): string | null {
  if (platformName === "win32") {
    return null;
  }
  const osName = platformName;
  return `sqlite-vss-${osName}-${archName}`;
}

function sqliteExtensionSuffix(platformName: NodeJS.Platform): string {
  if (platformName === "win32") {
    return ".dll";
  }
  if (platformName === "darwin") {
    return ".dylib";
  }
  return ".so";
}

function resolveSqliteVssPackageDir(packageName: string): string {
  if (app.isPackaged) {
    return path.join(
      process.resourcesPath,
      "app.asar.unpacked",
      "node_modules",
      packageName,
    );
  }

  const packageJsonPath = require.resolve(`${packageName}/package.json`);
  let packageDir = path.dirname(packageJsonPath);
  if (packageDir.includes("app.asar")) {
    packageDir = packageDir.replace("app.asar", "app.asar.unpacked");
  }
  return packageDir;
}

function prependWindowsPathEntries(entries: string[]): void {
  const currentPath = process.env.PATH ?? "";
  const parts = currentPath
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  const next = [...entries.filter((entry) => entry.length > 0), ...parts];
  process.env.PATH = Array.from(new Set(next)).join(";");
}

function loadExtensionFromCandidates(
  db: Database.Database,
  label: string,
  candidates: string[],
): void {
  const errors: string[] = [];
  let hasExistingCandidate = false;
  for (const candidate of candidates) {
    if (!existsSync(candidate)) {
      continue;
    }

    hasExistingCandidate = true;

    try {
      db.loadExtension(candidate);
      return;
    } catch (error) {
      errors.push(
        `${candidate}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  const details = hasExistingCandidate
    ? errors.join(" | ")
    : "no candidate files found";
  throw new Error(
    `[BOOTSTRAP] Unable to load sqlite-vss ${label} extension. Candidates: ${candidates.join(", ")}. Details: ${details}`,
  );
}

function loadSqliteVssExtensions(db: Database.Database): boolean {
  const packageName = sqliteVssPackageName(process.platform, process.arch);
  if (!packageName) {
    console.warn(
      "[BOOTSTRAP] sqlite-vss is not available for win32 in this distribution; vector search disabled.",
    );
    return false;
  }

  const packageDir = resolveSqliteVssPackageDir(packageName);
  const libPath = path.join(packageDir, "lib");
  const extensionSuffix = sqliteExtensionSuffix(process.platform);
  const vectorCandidates = [
    path.join(libPath, `vector0${extensionSuffix}`),
    path.join(libPath, "vector0"),
  ];
  const vssCandidates = [
    path.join(libPath, `vss0${extensionSuffix}`),
    path.join(libPath, "vss0"),
  ];

  if (process.platform === "win32") {
    prependWindowsPathEntries([libPath, packageDir]);
  }

  loadExtensionFromCandidates(db, "vector0", vectorCandidates);
  loadExtensionFromCandidates(db, "vss0", vssCandidates);
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
      const extensionsLoaded = loadSqliteVssExtensions(db);
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
