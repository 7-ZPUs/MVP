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
// Persona bindings
//   token (domain)  →  concrete implementation (adapter)
// ---------------------------------------------------------------------------
import { PERSONA_REPOSITORY_TOKEN } from '../domain/ports/outbound/IPersonaRepository';
import { PersonaSqliteRepository } from '../adapters/outbound/sqlite/PersonaSqliteRepository';

import { PERSONA_USE_CASE_TOKEN } from '../domain/ports/inbound/IPersonaUseCase';
import { PersonaService } from '../application/services/PersonaService';

container.register(PERSONA_REPOSITORY_TOKEN, { useClass: PersonaSqliteRepository });
container.register(PERSONA_USE_CASE_TOKEN, { useClass: PersonaService });

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
export { container };
