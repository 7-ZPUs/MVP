import 'reflect-metadata';
import { container } from 'tsyringe';

// ---- Services ----
import { HASHING_SERVICE_TOKEN } from './services/IHashingService';
import { CryptoHashingService } from './services/impl/CryptoHashingService';

// ---- Database provider ----
import { DATABASE_PROVIDER_TOKEN, DatabaseProvider } from './repo/impl/DatabaseProvider';

// ---- Repositories ----
import { DOCUMENTO_REPOSITORY_TOKEN } from './repo/IDocumentoRepository';
import { DocumentoRepository } from './repo/impl/DocumentoRepository';
import { FILE_REPOSITORY_TOKEN } from './repo/IFileRepository';
import { FileRepository } from './repo/impl/FileRepository';

// ---- Documento use cases ----
import { DocumentoUC } from './use-case/document/tokens';
import { GetDocumentoByIdUC } from './use-case/document/impl/GetDocumentoByIdUC';
import { GetDocumentiByProcessUC } from './use-case/document/impl/GetDocumentiByProcessUC';
import { GetDocumentiByStatusUC } from './use-case/document/impl/GetDocumentiByStatusUC';

// ---- File use cases ----
import { FileUC } from './use-case/file/tokens';
import { GetFileByIdUC } from './use-case/file/impl/GetFileByIdUC';
import { GetFilesByDocumentUC } from './use-case/file/impl/GetFilesByDocumentUC';
import { GetFilesByStatusUC } from './use-case/file/impl/GetFilesByStatusUC';

// Services
container.registerSingleton(DATABASE_PROVIDER_TOKEN, DatabaseProvider);
container.register(HASHING_SERVICE_TOKEN, { useClass: CryptoHashingService });

// Repositories
container.register(DOCUMENTO_REPOSITORY_TOKEN, { useClass: DocumentoRepository });
container.register(FILE_REPOSITORY_TOKEN, { useClass: FileRepository });

// Documento use cases
container.register(DocumentoUC.GET_BY_ID, { useClass: GetDocumentoByIdUC });
container.register(DocumentoUC.GET_BY_PROCESS, { useClass: GetDocumentiByProcessUC });
container.register(DocumentoUC.GET_BY_STATUS, { useClass: GetDocumentiByStatusUC });

// File use cases
container.register(FileUC.GET_BY_ID, { useClass: GetFileByIdUC });
container.register(FileUC.GET_BY_DOCUMENT, { useClass: GetFilesByDocumentUC });
container.register(FileUC.GET_BY_STATUS, { useClass: GetFilesByStatusUC });

export { container };

