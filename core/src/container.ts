import "reflect-metadata";
import { container } from "tsyringe";

// ---- Services ----

// ---- Repositories ----
import { DOCUMENTO_REPOSITORY_TOKEN } from './repo/IDocumentRepository';
import { DocumentRepository } from './repo/impl/DocumentRepository';
import { FILE_REPOSITORY_TOKEN } from './repo/IFileRepository';
import { FileRepository } from './repo/impl/FileRepository';
import { PROCESS_REPOSITORY_TOKEN } from './repo/IProcessRepository';
import { ProcessRepository } from './repo/impl/ProcessRepository';
import { DOCUMENT_CLASS_REPOSITORY_TOKEN } from './repo/IDocumentClassRepository';
import { DocumentClassRepository } from './repo/impl/DocumentClassRepository';
import { DIP_REPOSITORY_TOKEN } from './repo/IDipRepository';
import { DipRepository } from './repo/impl/DipRepository';

// ---- Documento use cases ----
import { DocumentoUC } from './use-case/document/tokens';
import { GetDocumentByIdUC } from './use-case/document/impl/GetDocumentByIdUC';
import { GetDocumentByProcessUC } from './use-case/document/impl/GetDocumentByProcessUC';
import { GetDocumentByStatusUC } from './use-case/document/impl/GetDocumentByStatusUC';
import { CheckDocumentIntegrityStatusUC } from './use-case/document/impl/CheckDocumentIntegrityStatusUC';

// ---- File use cases ----
import { FileUC } from './use-case/file/tokens';
import { GetFileByIdUC } from './use-case/file/impl/GetFileByIdUC';
import { GetFileByDocumentUC } from './use-case/file/impl/GetFileByDocumentUC';
import { GetFileByStatusUC } from './use-case/file/impl/GetFileByStatusUC';
import { CheckFileIntegrityStatusUC } from './use-case/file/impl/CheckFileIntegrityStatusUC';

// ---- Process use cases ----
import { ProcessUC } from './use-case/process/token';
import { GetProcessByStatusUC } from './use-case/process/impl/GetProcessByStatus';
import { GetProcessByIdUC } from './use-case/process/impl/GetProcessByIdUC';
import { GetProcessByDocumentClassUC } from './use-case/process/impl/GetProcessByDocumentClassUC';
import { CheckProcessIntegrityStatusUC } from './use-case/process/impl/CheckProcessIntegrityStatusUC';
import { DocumentClassUC } from './use-case/classe-documentale/tokens';
import { GetDocumentClassByDipIdUC } from './use-case/classe-documentale/impl/GetDocumentClassByDipUC';
import { GetDocumentClassByStatusUC } from './use-case/classe-documentale/impl/GetDocumentClassByStatusUC';
import { GetDocumentClassByIdUC } from './use-case/classe-documentale/impl/GetDocumentClassByIdUC';
import { CheckDocumentClassIntegrityStatusUC } from './use-case/classe-documentale/impl/CheckDocumentClassIntegrityStatusUC';
import { DipUC } from './use-case/dip/token';
import { GetDipByIdUC } from './use-case/dip/impl/GetDipByIdUC';
import { GetDipByStatusUC } from './use-case/dip/impl/GetDipByStatusUC';
import { CheckDipIntegrityStatusUC } from './use-case/dip/impl/CheckDipIntegrityStatusUC';
import { PACKAGE_READER_PORT_TOKEN } from "./repo/IPackageReaderPort";
import { LocalPackageReaderAdapter } from "./repo/impl/LocalPackageReaderAdapter";
import { FILE_SYSTEM_PROVIDER_TOKEN } from "./repo/impl/utils/IFileSystemProvider";
import { FileSystemProvider } from "./repo/impl/utils/FileSystemProvider";
import { DIP_PARSER_TOKEN } from "./repo/impl/utils/IDipParser";
import { XmlDipParser } from "./repo/impl/utils/XmlDipParser";


// Ports

container.register(PACKAGE_READER_PORT_TOKEN, { useClass: LocalPackageReaderAdapter });

// Utils

container.register(FILE_SYSTEM_PROVIDER_TOKEN, { useClass: FileSystemProvider });
container.register(DIP_PARSER_TOKEN, { useClass: XmlDipParser });

// Repositories
container.register(DOCUMENTO_REPOSITORY_TOKEN, { useClass: DocumentRepository });
container.register(FILE_REPOSITORY_TOKEN, { useClass: FileRepository });
container.register(PROCESS_REPOSITORY_TOKEN, { useClass: ProcessRepository });
container.register(DOCUMENT_CLASS_REPOSITORY_TOKEN, { useClass: DocumentClassRepository });
container.register(DIP_REPOSITORY_TOKEN, { useClass: DipRepository });

// Documento use cases
container.register(DocumentoUC.GET_BY_ID, { useClass: GetDocumentByIdUC });
container.register(DocumentoUC.GET_BY_PROCESS, { useClass: GetDocumentByProcessUC });
container.register(DocumentoUC.GET_BY_STATUS, { useClass: GetDocumentByStatusUC });
container.register(DocumentoUC.CHECK_INTEGRITY_STATUS, { useClass: CheckDocumentIntegrityStatusUC });

// File use cases
container.register(FileUC.GET_BY_ID, { useClass: GetFileByIdUC });
container.register(FileUC.GET_BY_DOCUMENT, { useClass: GetFileByDocumentUC });
container.register(FileUC.GET_BY_STATUS, { useClass: GetFileByStatusUC });
container.register(FileUC.CHECK_INTEGRITY_STATUS, { useClass: CheckFileIntegrityStatusUC });

// Process use cases
container.register(ProcessUC.GET_BY_STATUS, { useClass: GetProcessByStatusUC });
container.register(ProcessUC.GET_BY_ID, { useClass: GetProcessByIdUC });
container.register(ProcessUC.GET_BY_DOCUMENT_CLASS, { useClass: GetProcessByDocumentClassUC });
container.register(ProcessUC.CHECK_INTEGRITY_STATUS, { useClass: CheckProcessIntegrityStatusUC });

// DocumentClass use cases
container.register(DocumentClassUC.GET_BY_DIP_ID, { useClass: GetDocumentClassByDipIdUC });
container.register(DocumentClassUC.GET_BY_STATUS, { useClass: GetDocumentClassByStatusUC });
container.register(DocumentClassUC.GET_BY_ID, { useClass: GetDocumentClassByIdUC });
container.register(DocumentClassUC.CHECK_INTEGRITY_STATUS, { useClass: CheckDocumentClassIntegrityStatusUC });

// Dip use cases
container.register(DipUC.GET_BY_ID, { useClass: GetDipByIdUC });
container.register(DipUC.GET_BY_STATUS, { useClass: GetDipByStatusUC });
container.register(DipUC.CHECK_INTEGRITY_STATUS, { useClass: CheckDipIntegrityStatusUC });

export { container } from "tsyringe";
