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
Adapters (driving)  →  Application Services  →  Domain  ←  Adapters (driven)
```

| Layer | Location | Responsibility |
|---|---|---|
| **Domain** | `src/domain/` | Entities, value objects, and **port interfaces** (both driving and driven). Zero external imports. |
| **Application** | `src/application/` | Application services that implement driving ports and consume driven ports via constructor injection. |
| **Adapters — driving** | `src/adapters/driving/ipc/` | Electron `ipcMain` handlers. No business logic — delegates exclusively to driving port interfaces. |
| **Adapters — driven** | `src/adapters/driven/{sqlite,embeddings,zip,xml}/` | Concrete implementations of driven ports (SQLite, embeddings, ZIP, XML). |
| **Composition** | `src/composition/container.ts` | The **only** file that imports from both domain and driven adapters. Wires port tokens → concrete implementations via tsyringe. |
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
   - Add a *driving* interface (use case) under `src/domain/ports/driving/`.
   - Add any *driven* interfaces (repository, service) under `src/domain/ports/driven/`.
   - Export a Symbol token for each interface in the same file.
   - Re-export from the relevant `index.ts` barrel.

2. **Implement the application service** in `src/application/services/`:
   - The class implements the driving port interface.
   - Declare driven port dependencies as constructor parameters typed as the **interface**, not the concrete class.
   - Annotate with `@injectable()` and `@inject(TOKEN)` (from tsyringe).
   - Re-export from `src/application/services/index.ts`.

3. **Implement the driven adapter(s)** in `src/adapters/driven/<subsystem>/`:
   - The class implements the driven port interface.
   - Annotate with `@injectable()`.
   - Re-export from `src/adapters/driven/<subsystem>/index.ts`.

4. **Register the bindings** in `src/composition/container.ts`:
   ```ts
   import { MY_DRIVEN_PORT_TOKEN } from '../domain/ports/driven';
   import { MyDrivenAdapter } from '../adapters/driven/<subsystem>';
   import { MY_USE_CASE_TOKEN } from '../domain/ports/driving';
   import { MyApplicationService } from '../application/services';

   container.register(MY_DRIVEN_PORT_TOKEN, { useClass: MyDrivenAdapter });
   container.register(MY_USE_CASE_TOKEN,    { useClass: MyApplicationService });
   ```

5. **Add a driving IPC adapter** in `src/adapters/driving/ipc/`:
   - Resolve the driving port from the container via `container.resolve(TOKEN)`.
   - Register the `ipcMain.handle` call for the relevant `IpcChannels.*` constant.
   - Add the new IPC channel constant to `shared/ipc-channels.ts`.
   - Call `MyIpcAdapter.register(ipcMain)` in `main.ts`.

6. **Expose the channel to the Angular renderer** via Electron's `contextBridge` in `preload.ts`,
   so the Angular service can call `window.api.myChannel(args)`.

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
