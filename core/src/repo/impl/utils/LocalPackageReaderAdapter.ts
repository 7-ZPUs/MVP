import { IPackageReaderPort } from "../../utils/IPackageReaderPort";
import { Dip } from "../../../entity/Dip";
import { DocumentClass } from "../../../entity/DocumentClass";
import { Process } from "../../../entity/Process";
// Import Document and File types if not already defined
import { Document } from "../../../entity/Document";
import { File } from "../../../entity/File";
import { PlatformPath } from "path";

class LocalPackageReaderAdapter implements IPackageReaderPort {
  public async *readDip(dipPath: PlatformPath): AsyncGenerator<Dip> {
    throw new Error("Not implemented");
  }

  public async *readDocumentClasses(
    dipPath: PlatformPath,
  ): AsyncGenerator<DocumentClass> {
    // Implementation to read Document Classes from SQLite database
  }

  public async *readProcesses(dipPath: PlatformPath): AsyncGenerator<Process> {
    // Implementation to read Processes from SQLite database
  }

  public async *readDocuments(dipPath: PlatformPath): AsyncGenerator<Document> {
    // Implementation to read Documents from SQLite database
  }

  public async *readFiles(dipPath: PlatformPath): AsyncGenerator<File> {
    // Implementation to read Files from SQLite database
  }

  public readFileBytes(filePath: PlatformPath): ReadableStream {
    // Implementation to read File bytes from SQLite database
    // Example: return new ReadableStream();
    throw new Error("Not implemented");
  }
}
