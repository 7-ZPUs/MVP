import 'reflect-metadata';
import { container } from 'tsyringe';

// ---- Services ----
import { HASHING_SERVICE_TOKEN } from './services/IHashingService';
import { CryptoHashingService } from './services/impl/CryptoHashingService';

// ---- Database provider ----
import { DATABASE_PROVIDER_TOKEN, DatabaseProvider } from './repo/impl/DatabaseProvider';

// ---- Repositories ----
import { DOCUMENTO_REPOSITORY_TOKEN } from './repo/IDocumentRepository';
import { DocumentRepository } from './repo/impl/DocumentRepository';
import { FILE_REPOSITORY_TOKEN } from './repo/IFileRepository';
import { FileRepository } from './repo/impl/FileRepository';
import { PROCESS_REPOSITORY_TOKEN } from './repo/IProcessRepository';
import { ProcessRepository } from './repo/impl/ProcessRepository';
import { DOCUMENT_CLASS_REPOSITORY_TOKEN } from './repo/IDocumentClassRepository';
import { DocumentClassRepository } from './repo/impl/DocumentClassRepository';

// ---- Documento use cases ----
import { DocumentoUC } from './use-case/document/tokens';
import { GetDocumentByIdUC } from './use-case/document/impl/GetDocumentByIdUC';
import { GetDocumentByProcessUC } from './use-case/document/impl/GetDocumentByProcessUC';
import { GetDocumentByStatusUC } from './use-case/document/impl/GetDocumentByStatusUC';
import { CreateDocumentUC } from './use-case/document/impl/CreateDocumentUC';
import { SearchDocumentsUC } from './use-case/document/impl/SearchDocumentsUC';

// ---- File use cases ----
import { FileUC } from './use-case/file/tokens';
import { GetFileByIdUC } from './use-case/file/impl/GetFileByIdUC';
import { GetFileByDocumentUC } from './use-case/file/impl/GetFileByDocumentUC';
import { GetFileByStatusUC } from './use-case/file/impl/GetFileByStatusUC';
import { ExportFileUC } from './use-case/file/impl/ExportFileUC';
import { PrintFileUC } from './use-case/file/impl/PrintFileUC';

// ---- Process use cases ----
import { ProcessUC } from './use-case/process/token';
import { GetProcessByStatusUC } from './use-case/process/impl/GetProcessByStatus';
import { GetProcessByIdUC } from './use-case/process/impl/GetProcessByIdUC';
import { GetProcessByDocumentClassUC } from './use-case/process/impl/GetProcessByDocumentClassUC';
import { CreateProcessUC } from './use-case/process/impl/CreateProcessUC';
import { CreateFileUC } from './use-case/file/impl/CreateFileUC';
import { SearchProcessUC } from './use-case/process/impl/SearchProcessUC';

// ---- DocumentClass use cases ----
import { DocumentClassUC } from './use-case/classe-documentale/tokens';
import { SearchDocumentalClassUC } from './use-case/classe-documentale/impl/SearchDocumentalClassUC';


// Services
container.registerSingleton(DATABASE_PROVIDER_TOKEN, DatabaseProvider);
container.register(HASHING_SERVICE_TOKEN, { useClass: CryptoHashingService });

// Repositories
container.register(DOCUMENTO_REPOSITORY_TOKEN, { useClass: DocumentRepository });
container.register(FILE_REPOSITORY_TOKEN, { useClass: FileRepository });
container.register(PROCESS_REPOSITORY_TOKEN, { useClass: ProcessRepository });
container.register(DOCUMENT_CLASS_REPOSITORY_TOKEN, { useClass: DocumentClassRepository });

// Documento use cases
container.register(DocumentoUC.GET_BY_ID, { useClass: GetDocumentByIdUC });
container.register(DocumentoUC.GET_BY_PROCESS, { useClass: GetDocumentByProcessUC });
container.register(DocumentoUC.GET_BY_STATUS, { useClass: GetDocumentByStatusUC });
container.register(DocumentoUC.CREATE, { useClass: CreateDocumentUC });
container.register(DocumentoUC.SEARCH_BY_FILTERS, { useClass: SearchDocumentsUC });

// File use cases
container.register(FileUC.GET_BY_ID, { useClass: GetFileByIdUC });
container.register(FileUC.GET_BY_DOCUMENT, { useClass: GetFileByDocumentUC });
container.register(FileUC.GET_BY_STATUS, { useClass: GetFileByStatusUC });
container.register(FileUC.CREATE, { useClass: CreateFileUC });
container.register(FileUC.EXPORT_FILE, { useClass: ExportFileUC });
container.register(FileUC.PRINT_FILE, { useClass: PrintFileUC });

// Process use cases
container.register(ProcessUC.GET_BY_STATUS, { useClass: GetProcessByStatusUC });
container.register(ProcessUC.GET_BY_ID, { useClass: GetProcessByIdUC });
container.register(ProcessUC.GET_BY_DOCUMENT_CLASS, { useClass: GetProcessByDocumentClassUC });
container.register(ProcessUC.CREATE, { useClass: CreateProcessUC });
container.register(ProcessUC.SEARCH_BY_PROCESS_UUID, { useClass: SearchProcessUC });

// DocumentClass use cases
container.register(DocumentClassUC.SEARCH_BY_DOCUMENTAL_CLASS_NAME, { useClass: SearchDocumentalClassUC });


export { container };
