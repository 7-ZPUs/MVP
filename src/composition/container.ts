/**
 * Composition root — the **only** file permitted to import from both
 * domain (port tokens) and infrastructure (concrete implementations)
 * simultaneously.
 *
 * How to register a new binding:
 *  1. Define a Symbol token in `src/domain/ports/driven/` (or driving/).
 *  2. Implement the interface in `src/infrastructure/` (or `src/application/`).
 *  3. Add a `container.register(TOKEN, { useClass: ConcreteImpl })` call below.
 *  4. Inject the token via `@inject(TOKEN)` in consuming constructors.
 */

import 'reflect-metadata';
import { container } from 'tsyringe';

// ---------------------------------------------------------------------------
// Port tokens
// ---------------------------------------------------------------------------
// Tokens are declared here as Symbols so that they can be imported by both
// application services (for @inject) and this composition root (for registration)
// without creating a dependency from application → infrastructure.
//
// When domain port interfaces are added, export their tokens from
// `src/domain/ports/driven/` and `src/domain/ports/driving/`, then import
// and register them below.
//
// Example (uncomment once the interfaces exist):
//
// import { PACKAGE_REPOSITORY_TOKEN } from '../domain/ports/driven';
// import { SqlitePackageRepository } from '../infrastructure/sqlite';
// container.register(PACKAGE_REPOSITORY_TOKEN, { useClass: SqlitePackageRepository });

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
export { container };
