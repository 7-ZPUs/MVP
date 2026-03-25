import { Dip } from "../entity/Dip";
import { DocumentClass } from "../entity/DocumentClass";
import { Process } from "../entity/Process";
import { Document } from "../entity/Document";
import { File } from "../entity/File";

export const PACKAGE_READER_PORT_TOKEN = Symbol("IPackageReaderPort");

export interface IPackageReaderPort {
  readDip(dipPath: string): Promise<Dip>;
  readDocumentClasses(dipPath: string): AsyncGenerator<DocumentClass>;
  readProcesses(dipPath: string): AsyncGenerator<Process>;
  readDocuments(dipPath: string): AsyncGenerator<Document>;
  readFiles(dipPath: string): AsyncGenerator<File>;
  readFileBytes(filePath: string): Promise<NodeJS.ReadableStream>;
}
