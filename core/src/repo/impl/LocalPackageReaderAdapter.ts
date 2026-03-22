import * as path from "node:path";
import { IPackageReaderPort } from "../IPackageReaderPort";
import { IDipParser } from "./utils/IDipParser";
import { Dip } from "../../entity/Dip";
import { DocumentClass } from "../../entity/DocumentClass";
import { Process } from "../../entity/Process";
import { Document } from "../../entity/Document";
import { File } from "../../entity/File";
import type { IFileSystemProvider } from "./utils/IFileSystemProvider";
import type { ParsedDipIndex } from "./utils/IDipParser";

const DIP_INDEX_FILENAME_REGEX = /^DiPIndex\..+\.xml$/;

export class LocalPackageReaderAdapter implements IPackageReaderPort {
  private currentDipPath?: string;

  private currentParsedIndex?: ParsedDipIndex;

  constructor(
    private readonly parser: IDipParser,
    private readonly fileSystemProvider: IFileSystemProvider,
  ) {}

  private async resolveDipIndexFilename(dipPath: string): Promise<string> {
    const files = await this.fileSystemProvider.listFiles(dipPath);
    const filename = files
      .filter((file) => DIP_INDEX_FILENAME_REGEX.test(file))
      .sort((a, b) => a.localeCompare(b))[0];

    if (!filename) {
      throw new Error(
        `DiP index file not found in '${dipPath}'. Expected format: DiPIndex.<uuid>.xml`,
      );
    }

    return filename;
  }

  private async getParsedIndex(dipPath: string): Promise<ParsedDipIndex> {
    if (this.currentDipPath === dipPath && this.currentParsedIndex) {
      return this.currentParsedIndex;
    }

    const parsedIndex = this.parser.parseDipIndex(
      await this.fileSystemProvider.readTextFile(
        path.join(dipPath, await this.resolveDipIndexFilename(dipPath)),
      ),
    );

    this.currentDipPath = dipPath;
    this.currentParsedIndex = parsedIndex;

    return parsedIndex;
  }

  public async readDip(dipPath: string): Promise<Dip> {
    const parsedIndex = await this.getParsedIndex(dipPath);
    return new Dip(parsedIndex.dipUuid);
  }

  public async *readDocumentClasses(
    dipPath: string,
  ): AsyncGenerator<DocumentClass> {
    const parsedIndex = await this.getParsedIndex(dipPath);
    for (const dc of parsedIndex.documentClasses) {
      yield new DocumentClass(0, dc.uuid, dc.name, dc.timestamp as string);
    }
  }

  public async *readProcesses(dipPath: string): AsyncGenerator<Process> {
    const parsedIndex = await this.getParsedIndex(dipPath);
    for (const proc of parsedIndex.processes) {
      yield new Process(0, proc.uuid, proc.metadata);
    }
  }

  public async *readDocuments(dipPath: string): AsyncGenerator<Document> {
    const parsedIndex = await this.getParsedIndex(dipPath);
    for (const doc of parsedIndex.documents) {
      const metadataPath = path.join(
        dipPath,
        doc.documentPath,
        doc.metadataFilename,
      );
      const metadata = this.parser.parseDocumentMetadata(
        await this.fileSystemProvider.readTextFile(metadataPath),
      );
      yield new Document(doc.uuid, metadata, 0);
    }
  }

  public async *readFiles(dipPath: string): AsyncGenerator<File> {
    const parsedIndex = await this.getParsedIndex(dipPath);
    for (const file of parsedIndex.files) {
      yield new File(file.filename, file.path, "", file.isMain, 0);
    }
  }

  public async readFileBytes(filePath: string): Promise<ReadableStream> {
    return this.fileSystemProvider.openReadStream(filePath);
  }
}
