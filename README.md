# DIP Viewer

An Electron desktop application for reading, searching, and verifying DIP packages
(ZIP archives with a standardised AGO/METS folder structure). Metadata is indexed
into SQLite; semantic search is powered by `@xenova/transformers` with ONNX Runtime.

---

## Architecture

The Main Process follows **Hexagonal (Ports & Adapters)** architecture. The
dependency rule is strict: every arrow points inward.

```
Adapters (IPC)  →  Application Services  →  Domain  ←  Infrastructure
```

| Layer | Location | Responsibility |
|---|---|---|
| **Domain** | `src/domain/` | Entities, value objects, and **port interfaces** (both driving and driven). Zero external imports. |
| **Application** | `src/application/` | Application services that implement driving ports and consume driven ports via constructor injection. |
| **Infrastructure** | `src/infrastructure/` | Concrete implementations of driven ports (SQLite, embeddings, ZIP, XML). |
| **Adapters (IPC)** | `src/adapters/ipc/` | Electron IPC channel handlers. No business logic — delegates exclusively to driving port interfaces. |
| **Composition** | `src/composition/container.ts` | The **only** file that imports from both domain and infrastructure. Wires port tokens → concrete implementations via tsyringe. |
| **Shared** | `shared/ipc-channels.ts` | IPC channel name constants importable by both Main and Renderer processes. |

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

3. **Implement the infrastructure adapter(s)** in `src/infrastructure/<subsystem>/`:
   - The class implements the driven port interface.
   - Annotate with `@injectable()`.
   - Re-export from `src/infrastructure/<subsystem>/index.ts`.

4. **Register the bindings** in `src/composition/container.ts`:
   ```ts
   import { MY_DRIVEN_PORT_TOKEN } from '../domain/ports/driven';
   import { MyInfraAdapter } from '../infrastructure/<subsystem>';
   import { MY_USE_CASE_TOKEN } from '../domain/ports/driving';
   import { MyApplicationService } from '../application/services';

   container.register(MY_DRIVEN_PORT_TOKEN, { useClass: MyInfraAdapter });
   container.register(MY_USE_CASE_TOKEN,    { useClass: MyApplicationService });
   ```

5. **Add an IPC adapter** in `src/adapters/ipc/`:
   - Resolve the driving port from the container via `container.resolve(TOKEN)`.
   - Register the `ipcMain.handle` call for the relevant `IpcChannels.*` constant.
   - Add the new IPC channel constant to `shared/ipc-channels.ts`.
   - Call `MyIpcAdapter.register(ipcMain)` in `main.ts`.

---

## Scripts

| Command | Description |
|---|---|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled Electron app |
| `npm test` | Run Vitest in CI mode |
| `npm run test:watch` | Run Vitest in watch mode |

---

## Technology Stack

| Concern | Library |
|---|---|
| Runtime | Node.js 20, TypeScript 5, Electron 30 |
| Database | `better-sqlite3` + `sqlite-vss` |
| Semantic embeddings | `@xenova/transformers` + ONNX Runtime (Node) |
| Dependency injection | `tsyringe` |
| Testing | `vitest` |
| ZIP reading | `adm-zip` |
| XML parsing | `fast-xml-parser` |
