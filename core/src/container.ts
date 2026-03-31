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

// ---- AI adapter ----
import { WORD_EMBEDDING_PORT_TOKEN } from "./repo/IWordEmbedding";
import { WordEmbedding } from "./repo/impl/WordEmbedding";

// ---- Repositories ----
import { DOCUMENTO_REPOSITORY_TOKEN } from "./repo/IDocumentRepository";
import { DocumentRepository } from "./repo/impl/DocumentRepository";
import { FILE_REPOSITORY_TOKEN } from "./repo/IFileRepository";
import { FileRepository } from "./repo/impl/FileRepository";
import { PROCESS_REPOSITORY_TOKEN } from "./repo/IProcessRepository";
import { ProcessRepository } from "./repo/impl/ProcessRepository";
import { DOCUMENT_CLASS_REPOSITORY_TOKEN } from "./repo/IDocumentClassRepository";
import { DocumentClassRepository } from "./repo/impl/DocumentClassRepository";
import { DIP_REPOSITORY_TOKEN } from "./repo/IDipRepository";
import { DipRepository } from "./repo/impl/DipRepository";

// ---- Documento use cases ----
import { DocumentoUC } from "./use-case/document/tokens";
import { GetDocumentByIdUC } from "./use-case/document/impl/GetDocumentByIdUC";
import { GetDocumentByProcessUC } from "./use-case/document/impl/GetDocumentByProcessUC";
import { GetDocumentByStatusUC } from "./use-case/document/impl/GetDocumentByStatusUC";
import { CreateDocumentUC } from "./use-case/document/impl/CreateDocumentUC";
import { CheckDocumentIntegrityStatusUC } from "./use-case/document/impl/CheckDocumentIntegrityStatusUC";
import { SearchDocumentsUC } from "./use-case/document/impl/SearchDocumentsUC";
import { SearchSemanticUC } from "./use-case/document/impl/SearchSemanticUC";

// ---- File use cases ----
import { FileUC } from "./use-case/file/tokens";
import { GetFileByIdUC } from "./use-case/file/impl/GetFileByIdUC";
import { GetFileByDocumentUC } from "./use-case/file/impl/GetFileByDocumentUC";
import { GetFileByStatusUC } from "./use-case/file/impl/GetFileByStatusUC";
import { CheckFileIntegrityStatusUC } from "./use-case/file/impl/CheckFileIntegrityStatusUC";
import { ExportFileUC } from "./use-case/file/impl/ExportFileUC";
import { PrintFileUC } from "./use-case/file/impl/PrintFileUC";

// ---- Process use cases ----
import { ProcessUC } from "./use-case/process/token";
import { GetProcessByStatusUC } from "./use-case/process/impl/GetProcessByStatus";
import { GetProcessByIdUC } from "./use-case/process/impl/GetProcessByIdUC";
import { GetProcessByDocumentClassUC } from "./use-case/process/impl/GetProcessByDocumentClassUC";
import { CreateProcessUC } from "./use-case/process/impl/CreateProcessUC";
import { CheckProcessIntegrityStatusUC } from "./use-case/process/impl/CheckProcessIntegrityStatusUC";
import { CreateFileUC } from "./use-case/file/impl/CreateFileUC";
import { SearchProcessUC } from "./use-case/process/impl/SearchProcessUC";

// ---- DocumentClass use cases ----
import { DocumentClassUC } from "./use-case/classe-documentale/tokens";
import { SearchDocumentalClassUC } from "./use-case/classe-documentale/impl/SearchDocumentalClassUC";
import { GetDocumentClassByDipIdUC } from "./use-case/classe-documentale/impl/GetDocumentClassByDipUC";
import { GetDocumentClassByStatusUC } from "./use-case/classe-documentale/impl/GetDocumentClassByStatusUC";
import { GetDocumentClassByIdUC } from "./use-case/classe-documentale/impl/GetDocumentClassByIdUC";
import { CreateDocumentClassUC } from "./use-case/classe-documentale/impl/CreateDocumentClassUC";
import { CheckDocumentClassIntegrityStatusUC } from "./use-case/classe-documentale/impl/CheckDocumentClassIntegrityStatusUC";

// ---- Dip use cases ----
import { DipUC } from "./use-case/dip/token";
import { GetDipByIdUC } from "./use-case/dip/impl/GetDipByIdUC";
import { GetDipByStatusUC } from "./use-case/dip/impl/GetDipByStatusUC";
import { CreateDipUC } from "./use-case/dip/impl/CreateDipUC";
import { CheckDipIntegrityStatusUC } from "./use-case/dip/impl/CheckDipIntegrityStatusUC";

// Services
container.registerSingleton(DATABASE_PROVIDER_TOKEN, DatabaseProvider);
container.registerSingleton(WORD_EMBEDDING_PORT_TOKEN, WordEmbedding);
container.register(HASHING_SERVICE_TOKEN, { useClass: CryptoHashingService });

// Repositories
container.register(DOCUMENTO_REPOSITORY_TOKEN, {
  useClass: DocumentRepository,
});
container.register(FILE_REPOSITORY_TOKEN, { useClass: FileRepository });
container.register(PROCESS_REPOSITORY_TOKEN, { useClass: ProcessRepository });
container.register(DOCUMENT_CLASS_REPOSITORY_TOKEN, {
  useClass: DocumentClassRepository,
});
container.register(DIP_REPOSITORY_TOKEN, { useClass: DipRepository });

// Documento use cases
container.register(DocumentoUC.GET_BY_ID, { useClass: GetDocumentByIdUC });
container.register(DocumentoUC.GET_BY_PROCESS, {
  useClass: GetDocumentByProcessUC,
});
container.register(DocumentoUC.GET_BY_STATUS, {
  useClass: GetDocumentByStatusUC,
});
container.register(DocumentoUC.CREATE, { useClass: CreateDocumentUC });
container.register(DocumentoUC.CHECK_INTEGRITY_STATUS, {
  useClass: CheckDocumentIntegrityStatusUC,
});
container.register(DocumentoUC.SEARCH_BY_FILTERS, {
  useClass: SearchDocumentsUC,
});
container.register(DocumentoUC.SEARCH_SEMANTIC, { useClass: SearchSemanticUC });

// File use cases
container.register(FileUC.GET_BY_ID, { useClass: GetFileByIdUC });
container.register(FileUC.GET_BY_DOCUMENT, { useClass: GetFileByDocumentUC });
container.register(FileUC.GET_BY_STATUS, { useClass: GetFileByStatusUC });
container.register(FileUC.CREATE, { useClass: CreateFileUC });
container.register(FileUC.CHECK_INTEGRITY_STATUS, {
  useClass: CheckFileIntegrityStatusUC,
});
container.register(FileUC.EXPORT_FILE, { useClass: ExportFileUC });
container.register(FileUC.PRINT_FILE, { useClass: PrintFileUC });

// Process use cases
container.register(ProcessUC.GET_BY_STATUS, { useClass: GetProcessByStatusUC });
container.register(ProcessUC.GET_BY_ID, { useClass: GetProcessByIdUC });
container.register(ProcessUC.GET_BY_DOCUMENT_CLASS, {
  useClass: GetProcessByDocumentClassUC,
});
container.register(ProcessUC.CREATE, { useClass: CreateProcessUC });
container.register(ProcessUC.CHECK_INTEGRITY_STATUS, {
  useClass: CheckProcessIntegrityStatusUC,
});
container.register(ProcessUC.SEARCH_BY_PROCESS_UUID, {
  useClass: SearchProcessUC,
});

// DocumentClass use cases
container.register(DocumentClassUC.GET_BY_DIP_ID, {
  useClass: GetDocumentClassByDipIdUC,
});
container.register(DocumentClassUC.GET_BY_STATUS, {
  useClass: GetDocumentClassByStatusUC,
});
container.register(DocumentClassUC.GET_BY_ID, {
  useClass: GetDocumentClassByIdUC,
});
container.register(DocumentClassUC.CREATE, { useClass: CreateDocumentClassUC });
container.register(DocumentClassUC.CHECK_INTEGRITY_STATUS, {
  useClass: CheckDocumentClassIntegrityStatusUC,
});
container.register(DocumentClassUC.SEARCH_BY_DOCUMENTAL_CLASS_NAME, {
  useClass: SearchDocumentalClassUC,
});

// Dip use cases
container.register(DipUC.GET_BY_ID, { useClass: GetDipByIdUC });
container.register(DipUC.GET_BY_STATUS, { useClass: GetDipByStatusUC });
container.register(DipUC.CREATE, { useClass: CreateDipUC });
container.register(DipUC.CHECK_INTEGRITY_STATUS, {
  useClass: CheckDipIntegrityStatusUC,
});

export { container };
