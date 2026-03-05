/**
 * Electron Main Process entry point.
 *
 * Responsibilities:
 *  1. Bootstrap the DI container (side-effectful imports, reflect-metadata).
 *  2. Create the BrowserWindow.
 *  3. Register all IPC adapters so that renderer IPC calls are handled.
 *
 * No business logic lives here. Delegate everything to IPC adapters and
 * application services via the DI container.
 */

// Must be the very first import so that reflect-metadata is available for tsyringe.
import './src/composition/container';

import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';

// ---------------------------------------------------------------------------
// IPC adapter registration
// ---------------------------------------------------------------------------
// Import and call each adapter's `register(ipcMain)` function here once
// adapters are implemented.
//
// Example (uncomment once adapters exist):
// import { PackageIpcAdapter } from './src/adapters/inbound/ipc';
// PackageIpcAdapter.register(ipcMain);

// ---------------------------------------------------------------------------
// Window management
// ---------------------------------------------------------------------------

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // In development load the Angular dev server; in production load the built index.
  if (process.env['NODE_ENV'] === 'development') {
    win.loadURL('http://localhost:4200');
  } else {
    // Angular builds to dist/renderer/browser/ (outputPath set in renderer/angular.json)
    win.loadFile(path.join(__dirname, '..', 'dist', 'renderer', 'browser', 'index.html'));
  }

  return win;
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
