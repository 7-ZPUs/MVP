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
// ClasseDocumentale bindings
// ---------------------------------------------------------------------------

// Repository
import { CLASSE_DOCUMENTALE_REPOSITORY_TOKEN } from './repo/IClasseDocumentaleRepository';
import { ClasseDocumentaleRepository } from './repo/impl/ClasseDocumentaleRepository';

// Use Cases
import { ClasseDocumentaleUC } from './use-case/classe-documentale/tokens';
import { FindAllClasseDocumentaleUC } from './use-case/classe-documentale/impl/FindAllClasseDocumentaleUC';
import { FindByIdClasseDocumentaleUC } from './use-case/classe-documentale/impl/FindByIdClasseDocumentaleUC';
import { CreateClasseDocumentaleUC } from './use-case/classe-documentale/impl/CreateClasseDocumentaleUC';

container.register(CLASSE_DOCUMENTALE_REPOSITORY_TOKEN, { useClass: ClasseDocumentaleRepository });
container.register(ClasseDocumentaleUC.FIND_ALL, { useClass: FindAllClasseDocumentaleUC });
container.register(ClasseDocumentaleUC.FIND_BY_ID, { useClass: FindByIdClasseDocumentaleUC });
container.register(ClasseDocumentaleUC.CREATE, { useClass: CreateClasseDocumentaleUC });

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
export { container };
