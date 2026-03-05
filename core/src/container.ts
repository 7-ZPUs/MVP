/**
 * Composition root — the **only** file permitted to import from both
 * application/infrastructure contracts and concrete implementations
 * simultaneously.
 *
 * How to register a new binding:
 *  1. Define a Symbol token in `src/application/use-case/` or `src/infrastructure/repo/`.
 *  2. Implement concrete classes in the adjacent `impl/` folder.
 *  3. Add a `container.register(TOKEN, { useClass: ConcreteImpl })` call below.
 *  4. Inject the token via `@inject(TOKEN)` in consuming constructors.
 */

import 'reflect-metadata';
import { container } from 'tsyringe';

// ---------------------------------------------------------------------------
// Persona bindings
//   token (contract)  →  concrete implementation
// ---------------------------------------------------------------------------
import { PERSONA_REPOSITORY_TOKEN } from './repo/PersonaRepository';
import { SqlitePersonaRepository } from './repo/impl/sqlite/SqlitePersonaRepository';

import { PERSONA_USE_CASE_TOKEN } from './use-case/persona/ICreatePersonaUC';
import { PersonaCrudUseCase } from './use-case/persona/impl/CreatePersonaUC';

container.register(PERSONA_REPOSITORY_TOKEN, { useClass: SqlitePersonaRepository });
container.register(PERSONA_USE_CASE_TOKEN, { useClass: PersonaCrudUseCase });

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
export { container };
