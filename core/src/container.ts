import "reflect-metadata";
import { container } from "tsyringe";

// ---- Services ----
import { HASHING_SERVICE_TOKEN } from "./services/IHashingService";

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
import { VECTOR_REPOSITORY_TOKEN } from "./repo/VectorRepositoryToken";
import { VectorRepository } from "./repo/impl/VectorRepository";
import { DIP_DAO_TOKEN } from "./dao/IDipDAO";
import { DOCUMENT_CLASS_DAO_TOKEN } from "./dao/IDocumentClassDAO";
import { DOCUMENT_DAO_TOKEN } from "./dao/IDocumentDAO";
import { FILE_DAO_TOKEN } from "./dao/IFileDAO";
import { PROCESS_DAO_TOKEN } from "./dao/IProcessDAO";
import { VECTOR_DAO_TOKEN } from "./dao/IVectorDAO";
import { DipDAO } from "./dao/DipDAO";
import { DocumentClassDAO } from "./dao/DocumentClassDAO";
import { DocumentDAO } from "./dao/DocumentDAO";
import { FileDAO } from "./dao/FileDAO";
import { ProcessDAO } from "./dao/ProcessDAO";
import { VectorDAO } from "./dao/VectorDAO";
import { DIALOG_PORT_TOKEN } from "./repo/IDialogPort";
import { ElectronDialogPort } from "./repo/impl/DialogPort";

// ---- Documento use cases ----
import { DocumentoUC } from "./use-case/document/tokens";
import { GetDocumentByIdUC } from "./use-case/document/impl/GetDocumentByIdUC";
import { GetDocumentByProcessUC } from "./use-case/document/impl/GetDocumentByProcessUC";
import { GetDocumentByStatusUC } from "./use-case/document/impl/GetDocumentByStatusUC";
import { CheckDocumentIntegrityStatusUC } from "./use-case/document/impl/CheckDocumentIntegrityStatusUC";
import { SearchDocumentsUC } from "./use-case/document/impl/SearchDocumentsUC";
import { SearchSemanticUC } from "./use-case/document/impl/SearchSemanticUC";
import { GetCustomMetadataKeysUC } from "./use-case/document/impl/GetCustomMetadataKeysUC";

// ---- File use cases ----
import { FileUC } from "./use-case/file/tokens";
import { GetFileByIdUC } from "./use-case/file/impl/GetFileByIdUC";
import { GetFileByDocumentUC } from "./use-case/file/impl/GetFileByDocumentUC";
import { GetFileByStatusUC } from "./use-case/file/impl/GetFileByStatusUC";
import { CheckFileIntegrityStatusUC } from "./use-case/file/impl/CheckFileIntegrityStatusUC";
import { ExportFileUC } from "./use-case/file/impl/ExportFileUC";
import { GetFileContentUC } from "./use-case/file/impl/GetFileContentUC";
import { PrintFileUC } from "./use-case/file/impl/PrintFileUC";

// ---- Process use cases ----
import { ProcessUC } from "./use-case/process/token";
import { GetProcessByStatusUC } from "./use-case/process/impl/GetProcessByStatus";
import { GetProcessByIdUC } from "./use-case/process/impl/GetProcessByIdUC";
import { GetProcessByDocumentClassUC } from "./use-case/process/impl/GetProcessByDocumentClassUC";
import { CheckProcessIntegrityStatusUC } from "./use-case/process/impl/CheckProcessIntegrityStatusUC";
import { DocumentClassUC } from "./use-case/classe-documentale/tokens";
import { SearchProcessUC } from "./use-case/process/impl/SearchProcessUC";
import { SearchDocumentalClassUC } from "./use-case/classe-documentale/impl/SearchDocumentalClassUC";
import { GetDocumentClassByDipIdUC } from "./use-case/classe-documentale/impl/GetDocumentClassByDipUC";
import { GetDocumentClassByStatusUC } from "./use-case/classe-documentale/impl/GetDocumentClassByStatusUC";
import { GetDocumentClassByIdUC } from "./use-case/classe-documentale/impl/GetDocumentClassByIdUC";
import { CheckDocumentClassIntegrityStatusUC } from "./use-case/classe-documentale/impl/CheckDocumentClassIntegrityStatusUC";
import { DipUC } from "./use-case/dip/token";
import { GetDipByIdUC } from "./use-case/dip/impl/GetDipByIdUC";
import { GetDipByStatusUC } from "./use-case/dip/impl/GetDipByStatusUC";
import { CheckDipIntegrityStatusUC } from "./use-case/dip/impl/CheckDipIntegrityStatusUC";
import { PACKAGE_READER_PORT_TOKEN } from "./repo/IPackageReaderPort";
import { LocalPackageReaderAdapter } from "./repo/impl/LocalPackageReaderAdapter";
import { EXPORT_TOKEN } from "./repo/IExportPort";
import { LocalExportPort } from "./repo/impl/LocalExportPort";
import { PRINT_PORT_TOKEN } from "./repo/IPrintPort";
import { PrintPort } from "./repo/impl/PrintPort";
import { IDialogPort } from "./repo/IDialogPort";
import { DATA_MAPPER_TOKEN } from "./repo/impl/utils/IDataMapper";
import { DataMapper } from "./repo/impl/utils/DataMapper";
import { FILE_SYSTEM_PROVIDER_TOKEN } from "./repo/impl/utils/IFileSystemProvider";
import { FileSystemProvider } from "./repo/impl/utils/FileSystemProvider";
import { DIP_PARSER_TOKEN } from "./repo/impl/utils/IDipParser";
import { XmlDipParser } from "./repo/impl/utils/XmlDipParser";
import { TRANSACTION_MANAGER_TOKEN } from "./repo/ITransactionManager";
import { SqliteTransactionManager } from "./repo/impl/SqliteTransactionManager";
import { HashingService } from "./services/impl/HashingService";
import { INTEGRITY_VERIFICATION_SERVICE_TOKEN } from "./services/IIntegrityVerificationService";
import { IntegrityVerificationService } from "./services/impl/IntegrityVerificationService";
import { DOCUMENT_CHUNKER_TOKEN } from "./services/IEmbeddingService";
import { EmbeddingService } from "./services/impl/EmbeddingService";
import { INDEX_DIP_TOKEN } from "./use-case/utils/indexing/IIndexDip";
import { IndexDipUC } from "./use-case/utils/indexing/impl/IndexDip";
import { SQLITE_DB_TOKEN } from "../../db/DatabaseBootstrap";

container.register(PACKAGE_READER_PORT_TOKEN, {
  useClass: LocalPackageReaderAdapter,
});
container.register(EXPORT_TOKEN, {
  useClass: LocalExportPort,
});
container.register(PRINT_PORT_TOKEN, {
  useClass: PrintPort,
});
container.register(DIALOG_PORT_TOKEN, {
  useClass: ElectronDialogPort,
});
container.register(TRANSACTION_MANAGER_TOKEN, {
  useClass: SqliteTransactionManager,
});
container.register(HASHING_SERVICE_TOKEN, {
  useClass: HashingService,
});
container.register(DOCUMENT_CHUNKER_TOKEN, {
  useClass: EmbeddingService,
});
container.register(INTEGRITY_VERIFICATION_SERVICE_TOKEN, {
  useClass: IntegrityVerificationService,
});
container.register(INDEX_DIP_TOKEN, {
  useClass: IndexDipUC,
});

container.register(DATA_MAPPER_TOKEN, { useClass: DataMapper });
container.register(FILE_SYSTEM_PROVIDER_TOKEN, {
  useClass: FileSystemProvider,
});
container.register(DIP_PARSER_TOKEN, { useClass: XmlDipParser });

// Services
container.registerSingleton(WORD_EMBEDDING_PORT_TOKEN, WordEmbedding);
container.register(HASHING_SERVICE_TOKEN, { useClass: HashingService });

// Repositories
container.register(DOCUMENTO_REPOSITORY_TOKEN, {
  useClass: DocumentRepository,
});
container.register(DOCUMENTO_REPOSITORY_TOKEN, {
  useClass: DocumentRepository,
});
container.register(FILE_REPOSITORY_TOKEN, { useClass: FileRepository });
container.register(PROCESS_REPOSITORY_TOKEN, { useClass: ProcessRepository });
container.register(DOCUMENT_CLASS_REPOSITORY_TOKEN, {
  useClass: DocumentClassRepository,
});
container.register(DOCUMENT_CLASS_REPOSITORY_TOKEN, {
  useClass: DocumentClassRepository,
});
container.register(DIP_REPOSITORY_TOKEN, { useClass: DipRepository });
container.register(VECTOR_REPOSITORY_TOKEN, {
  useClass: VectorRepository,
});

// DAOs
container.register(DIP_DAO_TOKEN, { useClass: DipDAO });
container.register(DOCUMENT_CLASS_DAO_TOKEN, { useClass: DocumentClassDAO });
container.register(DOCUMENT_DAO_TOKEN, { useClass: DocumentDAO });
container.register(FILE_DAO_TOKEN, { useClass: FileDAO });
container.register(PROCESS_DAO_TOKEN, { useClass: ProcessDAO });
container.register(VECTOR_DAO_TOKEN, { useClass: VectorDAO });

// Documento use cases
container.register(DocumentoUC.GET_BY_ID, { useClass: GetDocumentByIdUC });
container.register(DocumentoUC.GET_BY_PROCESS, {
  useClass: GetDocumentByProcessUC,
});
container.register(DocumentoUC.GET_BY_STATUS, {
  useClass: GetDocumentByStatusUC,
});
container.register(DocumentoUC.CHECK_INTEGRITY_STATUS, {
  useClass: CheckDocumentIntegrityStatusUC,
});
container.register(DocumentoUC.SEARCH_BY_FILTERS, {
  useClass: SearchDocumentsUC,
});
container.register(DocumentoUC.SEARCH_SEMANTIC, { useClass: SearchSemanticUC });
container.register(DocumentoUC.GET_CUSTOM_METADATA_KEYS, {
  useClass: GetCustomMetadataKeysUC,
});

// File use cases
container.register(FileUC.GET_BY_ID, { useClass: GetFileByIdUC });
container.register(FileUC.GET_BY_DOCUMENT, { useClass: GetFileByDocumentUC });
container.register(FileUC.GET_BY_STATUS, { useClass: GetFileByStatusUC });
container.register(FileUC.CHECK_INTEGRITY_STATUS, {
  useClass: CheckFileIntegrityStatusUC,
});
container.register(FileUC.EXPORT_FILE, { useClass: ExportFileUC });
container.register(FileUC.GET_CONTENT, { useClass: GetFileContentUC });
container.register(FileUC.PRINT_FILE, { useClass: PrintFileUC });

// Process use cases
container.register(ProcessUC.GET_BY_STATUS, { useClass: GetProcessByStatusUC });
container.register(ProcessUC.GET_BY_ID, { useClass: GetProcessByIdUC });
container.register(ProcessUC.GET_BY_DOCUMENT_CLASS, {
  useClass: GetProcessByDocumentClassUC,
});
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
container.register(DocumentClassUC.CHECK_INTEGRITY_STATUS, {
  useClass: CheckDocumentClassIntegrityStatusUC,
});
container.register(DocumentClassUC.SEARCH_BY_DOCUMENTAL_CLASS_NAME, {
  useClass: SearchDocumentalClassUC,
});

// Dip use cases
container.register(DipUC.GET_BY_ID, { useClass: GetDipByIdUC });
container.register(DipUC.GET_BY_STATUS, { useClass: GetDipByStatusUC });
container.register(DipUC.CHECK_INTEGRITY_STATUS, {
  useClass: CheckDipIntegrityStatusUC,
});

export { container } from "tsyringe";
