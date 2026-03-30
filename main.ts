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
import "./core/src/container";
import { container } from "tsyringe";

import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";

// Disable GPU acceleration — required in headless/container environments
// where no real GPU is available (dev containers, CI, Codespaces, etc.).
app.disableHardwareAcceleration();

// ---------------------------------------------------------------------------
// IPC adapter registration
// ---------------------------------------------------------------------------
import { BrowsingIpcAdapter } from "./core/src/ipc/BrowsingIpcAdapter";
import { CreateIpcAdapter } from "./core/src/ipc/CreateIpcAdapter";
import { SearchIpcAdapter } from "./core/src/ipc/SearchIpcAdapter";
import { FileViewerIpcAdapter } from "./core/src/ipc/FileViewerIpcAdapter";

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------
import { DATABASE_PROVIDER_TOKEN, DatabaseProvider } from "./core/src/repo/impl/DatabaseProvider";

// ---------------------------------------------------------------------------
// Window management
// ---------------------------------------------------------------------------

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "core", "src", "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // In development load the Angular dev server; in production load the built index.
  if (process.env["NODE_ENV"] === "development") {
    win.loadURL("http://localhost:4200");
  } else {
    // Angular builds to dist/renderer/browser/ (outputPath set in renderer/angular.json)
    win.loadFile(
      path.join(__dirname, "..", "dist", "renderer", "browser", "index.html"),
    );
  }

  return win;
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------

app.whenReady().then(async () => {
  const dbProvider = container.resolve<DatabaseProvider>(DATABASE_PROVIDER_TOKEN);
  await dbProvider.init();

  BrowsingIpcAdapter.register(ipcMain);
  CreateIpcAdapter.register(ipcMain);
  SearchIpcAdapter.register(ipcMain);
  FileViewerIpcAdapter.register(ipcMain);

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});