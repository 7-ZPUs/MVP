import "reflect-metadata";
import { container } from "tsyringe";

// ---- Services ----
import { HASHING_SERVICE_TOKEN } from "./services/IHashingService";
import { CryptoHashingService } from "./services/impl/CryptoHashingService";

// ---- Database provider ----
import {
  DATABASE_PROVIDER_TOKEN,
  DatabaseProvider,
} from "./repo/impl/DatabaseProvider";

// ---- Repositories ----
import { DOCUMENTO_REPOSITORY_TOKEN } from "./repo/IDocumentRepository";
import { DocumentRepository } from "./repo/impl/DocumentRepository";
import { FILE_REPOSITORY_TOKEN } from "./repo/IFileRepository";
import { FileRepository } from "./repo/impl/FileRepository";
import { PROCESS_REPOSITORY_TOKEN } from "./repo/IProcessRepository";
import { ProcessRepository } from "./repo/impl/ProcessRepository";
import { DIP_REPOSITORY_TOKEN } from "./repo/IDipRepository";
import { DipRepository } from "./repo/impl/DipRepository";
import { DOCUMENT_CLASS_REPOSITORY_TOKEN } from "./repo/IDocumentClassRepository";
import { DocumentClassRepository } from "./repo/impl/DocumentClassRepository";
import { PACKAGE_READER_PORT_TOKEN } from "./repo/IPackageReaderPort";
import { LocalPackageReaderAdapter } from "./repo/impl/LocalPackageReaderAdapter";
import { DIP_INDEX_PARSER_TOKEN } from "./repo/impl/utils/IDipParser";
import { XmlDipParser } from "./repo/impl/utils/XmlDipParser";

// ---- Document use cases ----
import { DocumentoUC } from "./use-case/document/tokens";
import { GetDocumentByIdUC } from "./use-case/document/impl/GetDocumentByIdUC";
import { GetDocumentByProcessUC } from "./use-case/document/impl/GetDocumentByProcessUC";
import { GetDocumentByStatusUC } from "./use-case/document/impl/GetDocumentByStatusUC";
import { CreateDocumentUC } from "./use-case/document/impl/CreateDocumentUC";

// ---- File use cases ----
import { FileUC } from "./use-case/file/tokens";
import { GetFileByIdUC } from "./use-case/file/impl/GetFileByIdUC";
import { GetFileByDocumentUC } from "./use-case/file/impl/GetFileByDocumentUC";
import { GetFileByStatusUC } from "./use-case/file/impl/GetFileByStatusUC";

// ---- Process use cases ----
import { ProcessUC } from "./use-case/process/token";
import { GetProcessByStatusUC } from "./use-case/process/impl/GetProcessByStatus";
import { GetProcessByIdUC } from "./use-case/process/impl/GetProcessByIdUC";
import { GetProcessByDocumentClassUC } from "./use-case/process/impl/GetProcessByDocumentClassUC";
import { CreateProcessUC } from "./use-case/process/impl/CreateProcessUC";
import { CreateFileUC } from "./use-case/file/impl/CreateFileUC";
import { INDEX_DIP_TOKEN } from "./use-case/utils/indexing/IIndexDip";
import { IndexDip } from "./use-case/utils/indexing/impl/IndexDip";

// Services
container.registerSingleton(DATABASE_PROVIDER_TOKEN, DatabaseProvider);
container.register(HASHING_SERVICE_TOKEN, { useClass: CryptoHashingService });

// Repositories
container.register(DOCUMENTO_REPOSITORY_TOKEN, {
  useClass: DocumentRepository,
});
container.register(FILE_REPOSITORY_TOKEN, { useClass: FileRepository });
container.register(PROCESS_REPOSITORY_TOKEN, { useClass: ProcessRepository });
container.register(DIP_REPOSITORY_TOKEN, { useClass: DipRepository });
container.register(DOCUMENT_CLASS_REPOSITORY_TOKEN, {
  useClass: DocumentClassRepository,
});

// Package reader
container.register(DIP_INDEX_PARSER_TOKEN, { useClass: XmlDipParser });
container.register(PACKAGE_READER_PORT_TOKEN, {
  useFactory: (dependencyContainer) =>
    new LocalPackageReaderAdapter(
      dependencyContainer.resolve(DIP_INDEX_PARSER_TOKEN),
    ),
});

// Documento use cases
container.register(DocumentoUC.GET_BY_ID, { useClass: GetDocumentByIdUC });
container.register(DocumentoUC.GET_BY_PROCESS, {
  useClass: GetDocumentByProcessUC,
});
container.register(DocumentoUC.GET_BY_STATUS, {
  useClass: GetDocumentByStatusUC,
});
container.register(DocumentoUC.CREATE, { useClass: CreateDocumentUC });

// File use cases
container.register(FileUC.GET_BY_ID, { useClass: GetFileByIdUC });
container.register(FileUC.GET_BY_DOCUMENT, { useClass: GetFileByDocumentUC });
container.register(FileUC.GET_BY_STATUS, { useClass: GetFileByStatusUC });
container.register(FileUC.CREATE, { useClass: CreateFileUC });

// Process use cases
container.register(ProcessUC.GET_BY_STATUS, { useClass: GetProcessByStatusUC });
container.register(ProcessUC.GET_BY_ID, { useClass: GetProcessByIdUC });
container.register(ProcessUC.GET_BY_DOCUMENT_CLASS, {
  useClass: GetProcessByDocumentClassUC,
});
container.register(ProcessUC.CREATE, { useClass: CreateProcessUC });

// Indexing use cases
container.register(INDEX_DIP_TOKEN, { useClass: IndexDip });

export { container } from "tsyringe";
