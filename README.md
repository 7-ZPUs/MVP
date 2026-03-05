# DIP Viewer

An Electron desktop application for reading, searching, and verifying DIP packages
(ZIP archives with a standardised AGO/METS folder structure). Metadata is indexed
into SQLite; semantic search is powered by `@xenova/transformers` with ONNX Runtime.

---

## Architecture

The project is split into two sub-projects that mirror the Electron process model:

| Sub-project | Location | Description |
|---|---|---|
| **Main process** | `./` (root) | Node.js/TypeScript — hexagonal backend |
| **Renderer process** | `renderer/` | Angular SPA — user interface |

### Main Process — Hexagonal (Ports & Adapters)

The Main Process follows strict **Hexagonal (Ports & Adapters)** architecture. The
dependency rule is strict: every arrow points inward.

```
Adapters (inbound)  →  Application Services  →  Domain  ←  Adapters (outbound)
```

| Layer | Location | Responsibility |
|---|---|---|
| **Domain** | `src/domain/` | Entities, value objects, and **port interfaces** (both inbound and outbound). Zero external imports. |
| **Application** | `src/application/` | Application services that implement inbound ports and consume outbound ports via constructor injection. |
| **Adapters — inbound** | `src/adapters/inbound/ipc/` | Electron `ipcMain` handlers. No business logic — delegates exclusively to inbound port interfaces. |
| **Adapters — outbound** | `src/adapters/outbound/{sqlite,embeddings,zip,xml}/` | Concrete implementations of outbound ports (SQLite, embeddings, ZIP, XML). |
| **Composition** | `src/composition/container.ts` | The **only** file that imports from both domain and outbound adapters. Wires port tokens → concrete implementations via tsyringe. |
| **Shared** | `shared/ipc-channels.ts` | IPC channel name constants importable by both Main and Renderer processes. |

### Renderer Process — Angular

The Angular app lives in `renderer/` and is a standard Angular project bootstrapped
with the Angular CLI. It communicates with the Main Process exclusively through the
typed IPC channels declared in `shared/ipc-channels.ts` via Electron's `contextBridge`
preload API.

---

## Dependency Injection

tsyringe is used for constructor injection. The composition root
(`src/composition/container.ts`) is the single place where all bindings are
registered. Each port interface has a corresponding Symbol token declared
alongside its interface definition.

---

## Adding a New Feature End-to-End

1. **Define the port interfaces** in `src/domain/ports/`:
   - Add an *inbound* interface (use case) under `src/domain/ports/inbound/`.
   - Add any *outbound* interfaces (repository, service) under `src/domain/ports/outbound/`.
   - Export a Symbol token for each interface in the same file.
   - Re-export from the relevant `index.ts` barrel.

2. **Implement the application service** in `src/application/services/`:
   - The class implements the inbound port interface.
   - Declare outbound port dependencies as constructor parameters typed as the **interface**, not the concrete class.
   - Annotate with `@injectable()` and `@inject(TOKEN)` (from tsyringe).
   - Re-export from `src/application/services/index.ts`.

3. **Implement the outbound adapter(s)** in `src/adapters/outbound/<subsystem>/`:
   - The class implements the outbound port interface.
   - Annotate with `@injectable()`.
   - Re-export from `src/adapters/outbound/<subsystem>/index.ts`.

4. **Register the bindings** in `src/composition/container.ts`:
   ```ts
   import { MY_OUTBOUND_PORT_TOKEN } from '../domain/ports/outbound';
   import { MyOutboundAdapter } from '../adapters/outbound/<subsystem>';
   import { MY_USE_CASE_TOKEN } from '../domain/ports/inbound';
   import { MyApplicationService } from '../application/services';

   container.register(MY_OUTBOUND_PORT_TOKEN, { useClass: MyOutboundAdapter });
   container.register(MY_USE_CASE_TOKEN,      { useClass: MyApplicationService });
   ```

5. **Add an inbound IPC adapter** in `src/adapters/inbound/ipc/`:
   - Resolve the inbound port from the container via `container.resolve(TOKEN)`.
   - Register the `ipcMain.handle` call for the relevant `IpcChannels.*` constant.
   - Add the new IPC channel constant to `shared/ipc-channels.ts`.
   - Call `MyIpcAdapter.register(ipcMain)` in `main.ts`.

6. **Expose the channel to the Angular renderer** via Electron's `contextBridge` in `preload.ts`,
   so the Angular service can call `window.api.myChannel(args)`.

---

## Dev Container

A ready-to-use dev container is provided in `.devcontainer/`. It is based on the
official Microsoft Node.js 20 (Debian Bookworm) image and includes:

- Node.js 20 + npm
- Angular CLI (global)
- All Electron system dependencies (`libnss3`, `libgbm1`, `xvfb`, etc.)
- Recommended VS Code extensions (Angular Language Service, ESLint, Prettier, …)

### Opening in VS Code

1. Install the **Dev Containers** extension.
2. Open the repository folder and choose **Reopen in Container** when prompted.
3. Dependencies are installed automatically (`postCreateCommand`).

### Opening in GitHub Codespaces

Click **Code → Codespaces → Create codespace on `main`** — the container will be
built and started automatically.

---

## Scripts

| Command | Description |
|---|---|
| `npm run build` | Compile Main Process TypeScript to `dist/` |
| `npm run build:renderer` | Build Angular renderer to `dist/renderer/` |
| `npm run build:all` | Build renderer then main process |
| `npm start` | Run the compiled Electron app |
| `npm run start:renderer` | Start Angular dev server on `localhost:4200` |
| `npm test` | Run Vitest (main process) in CI mode |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:renderer` | Run Angular unit tests |

---

## Technology Stack

| Concern | Library |
|---|---|
| Runtime | Node.js 20, TypeScript 5, Electron 30 |
| Renderer | Angular 21 (standalone components, SCSS) |
| Database | `better-sqlite3` + `sqlite-vss` |
| Semantic embeddings | `@xenova/transformers` + ONNX Runtime (Node) |
| Dependency injection | `tsyringe` |
| Testing (main) | `vitest` |
| Testing (renderer) | Angular's built-in (`@angular/build:unit-test`) |
| ZIP reading | `adm-zip` |
| XML parsing | `fast-xml-parser` |
