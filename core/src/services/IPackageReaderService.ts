import { Dip } from "../entity/Dip";
import { DocumentClass } from "../entity/DocumentClass";
import { Process } from "../entity/Process";
import { Document } from "../entity/Document";
import { File } from "../entity/File";

export const PACKAGE_READER_PORT_TOKEN = Symbol("IPackageReaderService");

export interface IPackageReaderService {
  readDip(): Promise<Dip>;
  readDocumentClasses(): AsyncGenerator<DocumentClass>;
  readProcesses(): AsyncGenerator<Process>;
  readDocuments(): AsyncGenerator<Document>;
  readFiles(): AsyncGenerator<File>;
  setDipPath(dipPath: string): Promise<void>;
}
