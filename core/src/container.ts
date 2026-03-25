/**
 * Composition root — the **only** file permitted to import from both
 * domain (port tokens) and outbound adapters (concrete implementations)
 * simultaneously.
 *
 * How to register a new binding:
 *  1. Define a Symbol token in `src/domain/ports/outbound/` (or inbound/).
 *  2. Implement the outbound adapter in `src/adapters/outbound/` (or the
 *     inbound adapter in `src/adapters/inbound/`).
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
// without creating a dependency from application → adapters.
//
// When domain port interfaces are added, export their tokens from
// `src/domain/ports/outbound/` and `src/domain/ports/inbound/`, then import
// and register them below.
//
// Example (uncomment once the interfaces exist):
//
// import { PACKAGE_REPOSITORY_TOKEN } from '../domain/ports/outbound';
// import { SqlitePackageRepository } from '../adapters/outbound/sqlite';
// container.register(PACKAGE_REPOSITORY_TOKEN, { useClass: SqlitePackageRepository });

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
export { container };