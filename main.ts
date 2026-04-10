/**
 * Electron Main Process entry point.
 *
 * Responsibilities:
 *  1. Bootstrap the DI container (side-effectful imports, reflect-metadata).
 *  2. Initialise the database (async, via DatabaseProvider.init()).
 *  3. Register all IPC adapters so that renderer IPC calls are handled.
 *  4. Create the BrowserWindow.
 *
 * No business logic lives here. Delegate everything to IPC adapters and
 * application services via the DI container.
 */

// Must be the very first import so that reflect-metadata is available for tsyringe
// and all injectable classes are registered in the container.
import "reflect-metadata";
import "./core/src/container";
import { container } from "tsyringe";
import Database from "better-sqlite3";

import { app, BrowserWindow, ipcMain } from "electron";
import { existsSync, rmSync } from "node:fs";
import * as path from "node:path";
import { IpcChannels } from "./shared/ipc-channels";
import {
  ApplicationBootstrapAdapter,
  SQLITE_DB_TOKEN,
} from "./db/DatabaseBootstrap";
import { DATABASE_PROVIDER_PATH_TOKEN } from "./core/src/repo/impl/DatabaseProvider";
import {
  INDEX_DIP_TOKEN,
  IIndexDip,
} from "./core/src/use-case/utils/indexing/IIndexDip";

// Disable GPU acceleration — required in headless/container environments
// where no real GPU is available (dev containers, CI, Codespaces, etc.).
app.disableHardwareAcceleration();

// ---------------------------------------------------------------------------
// IPC adapter registration
// ---------------------------------------------------------------------------
import { BrowsingIpcAdapter } from "./core/src/ipc/BrowsingIpcAdapter";
import { CheckIntegrityIpcAdapter } from "./core/src/ipc/CheckIntegrityIpcAdapter";
import { SearchIpcAdapter } from "./core/src/ipc/SearchIpcAdapter";
import { FileViewerIpcAdapter } from "./core/src/ipc/FileViewerIpcAdapter";

const IPC_CHANNEL_REGISTRY_CHANNEL = "__app:get-ipc-channels";

app.name = "dip-reader";

// ---------------------------------------------------------------------------
// Window management
// ---------------------------------------------------------------------------

function createWindow(): BrowserWindow {
  console.warn(path.join(__dirname, "core", "assets", "icona.png"));
  const win = new BrowserWindow({
    width: 1920,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "core", "src", "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, "core", "assets", "icona.png"),
    title: "DIPReader 1.0.0",
  });
  win.removeMenu();
  // In development load the Angular dev server; in production load the built index.
  if (process.env["SERVE_FRONTEND"] === "true") {
    win.loadURL("http://localhost:4200");
  } else {
    // Angular builds to dist/renderer/browser/ (outputPath set in renderer/angular.json)
    win.loadFile(
      path.join(__dirname, "..", "dist", "renderer", "browser", "index.html"),
    );
  }

  return win;
}

function resolveProductionDipPath(): string {
  const appImagePath = process.env["APPIMAGE"];
  if (appImagePath && existsSync(appImagePath)) {
    const appPath = path.dirname(appImagePath);
    console.log(
      "[BOOTSTRAP] Resolving DIP path in production from APPIMAGE host path:",
      appPath,
    );
    return appPath;
  }

  const appPath = path.dirname(process.cwd());
  console.log(
    "[BOOTSTRAP] Resolving DIP path in production. App path:",
    appPath,
  );
  return appPath;
}

function resolveBootstrapDipPath(): string {
  if (process.env["NODE_ENV"] !== "development") {
    return resolveProductionDipPath();
  }
  console.log("[BOOTSTRAP] current working directory:", process.cwd());
  const customDipPath = path.resolve(process.cwd(), "resources", "test-dip");
  if (existsSync(customDipPath)) {
    return customDipPath;
  }

  console.warn(
    `[BOOTSTRAP] Custom dev DIP path not found: ${customDipPath}. Falling back to auto-discovery.`,
  );
  return resolveProductionDipPath();
}

function exportDb(dstPath: string): void {
  const dbPath = path.resolve(process.cwd(), "dip-viewer.db");
  if (!existsSync(dbPath)) {
    console.warn(`Database file not found at ${dbPath}, skipping export.`);
    return;
  }

  const exportPath = path.resolve(process.cwd(), dstPath);
  try {
    // In a real application, we would use the IExportPort abstraction here.
    // For simplicity, we just copy the file directly.
    require("node:fs").copyFileSync(dbPath, exportPath);
    console.log(`Database exported successfully to ${exportPath}`);
  } catch (error) {
    console.error(
      `Failed to export database from ${dbPath} to ${exportPath}:`,
      error instanceof Error ? error.message : String(error),
    );
  }
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------

(async () => {
  await app.whenReady();

  const dbPath = path.join(app.getPath("userData"), "dip-viewer.db");
  rmSync(dbPath, { force: true });
  const db = new Database(dbPath);
  container.register(SQLITE_DB_TOKEN, { useValue: db });

  // Ensure all DAOs/repositories use the same DB file created by bootstrap.
  const dipPath = resolveBootstrapDipPath();

  container.register("DIP_PATH_TOKEN", {
    useValue: dipPath,
  });

  container.register(DATABASE_PROVIDER_PATH_TOKEN, {
    useValue: dbPath,
  });

  console.warn("[BOOTSTRAP] NODE_ENV =", process.env["NODE_ENV"]);
  const lazyIndexDip: IIndexDip = {
    execute: (dipPath: string) =>
      container.resolve<IIndexDip>(INDEX_DIP_TOKEN).execute(dipPath),
  };
  const bootstrapAdapter = new ApplicationBootstrapAdapter(lazyIndexDip);
  process.env.DIP_PATH = dipPath;
  void bootstrapAdapter.bootstrap(dipPath);

  // Register all IPC adapters before creating the window
  ipcMain.on(IPC_CHANNEL_REGISTRY_CHANNEL, (event) => {
    event.returnValue = Object.values(IpcChannels);
  });

  ipcMain.handle(IpcChannels.BOOTSTRAP_STATUS, () => {
    return bootstrapAdapter.getBootstrapStatus();
  });

  BrowsingIpcAdapter.register(ipcMain);
  CheckIntegrityIpcAdapter.register(ipcMain);
  SearchIpcAdapter.register(ipcMain);
  FileViewerIpcAdapter.register(ipcMain);

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });
})();
