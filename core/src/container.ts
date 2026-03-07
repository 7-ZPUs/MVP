import 'reflect-metadata';
import { container } from 'tsyringe';
import { HASHING_SERVICE_TOKEN } from './services/IHashingService';
import { CryptoHashingService } from './services/impl/CryptoHashingService';
import { CLASSE_DOCUMENTALE_REPOSITORY_TOKEN } from './repo/IClasseDocumentaleRepository';
import { ClasseDocumentaleRepository } from './repo/impl/ClasseDocumentaleRepository';
import { CheckClasseDocumentaleIntegrityUC } from './use-case/classe-documentale/impl/CheckClasseDocumentaleIntegrity';
import { CreateClasseDocumentaleUC } from './use-case/classe-documentale/impl/CreateClasseDocumentaleUC';
import { GetAllClasseDocumentaleUC } from './use-case/classe-documentale/impl/GetAllClasseDocumentaleUC';
import { GetClasseDocumentaleByIdUC } from './use-case/classe-documentale/impl/GetClasseDocumentaleByIdUC';
import { ClasseDocumentaleUC } from './use-case/classe-documentale/tokens';

// Services
container.register(HASHING_SERVICE_TOKEN, { useClass: CryptoHashingService });

// Repository
container.register(CLASSE_DOCUMENTALE_REPOSITORY_TOKEN, { useClass: ClasseDocumentaleRepository });

// Use Cases
container.register(ClasseDocumentaleUC.GET_ALL, { useClass: GetAllClasseDocumentaleUC });
container.register(ClasseDocumentaleUC.GET_BY_ID, { useClass: GetClasseDocumentaleByIdUC });
container.register(ClasseDocumentaleUC.CREATE, { useClass: CreateClasseDocumentaleUC });
container.register(ClasseDocumentaleUC.CHECK_INTEGRITY, { useClass: CheckClasseDocumentaleIntegrityUC });

export { container };
