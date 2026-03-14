import { PlatformPath } from "node:path";
import { Dip } from "../entity/Dip";
import { DocumentClass } from "../entity/DocumentClass";
import { Process } from "../entity/Process";
import { Document } from "../entity/Document";
import { File } from "../entity/File";

export const PACKAGE_READER_PORT_TOKEN = Symbol("IPackageReaderPort");

export interface IPackageReaderPort {
  readDip(dipPath: PlatformPath): AsyncGenerator<Dip>;
  readDocumentClasses(dipPath: PlatformPath): AsyncGenerator<DocumentClass>;
  readProcesses(dipPath: PlatformPath): AsyncGenerator<Process>;
  readDocuments(dipPath: PlatformPath): AsyncGenerator<Document>;
  readFiles(dipPath: PlatformPath): AsyncGenerator<File>;
  readFileBytes(filePath: PlatformPath): ReadableStream;
}
