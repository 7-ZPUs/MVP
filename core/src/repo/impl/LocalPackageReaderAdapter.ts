import * as path from "node:path";
import { IPackageReaderPort } from "../IPackageReaderPort";
import { DIP_PARSER_TOKEN, IDipParser } from "./utils/IDipParser";
import { Dip } from "../../entity/Dip";
import { DocumentClass } from "../../entity/DocumentClass";
import { Process } from "../../entity/Process";
import { Document } from "../../entity/Document";
import { File } from "../../entity/File";
import {
  FILE_SYSTEM_PROVIDER_TOKEN,
  type IFileSystemProvider,
} from "./utils/IFileSystemProvider";
import { inject, injectable } from "tsyringe";
import { DATA_MAPPER_TOKEN, IDataMapper } from "./utils/IDataMapper";

const DIP_INDEX_FILENAME_REGEX = /^DiPIndex\..+\.xml$/;

@injectable()
export class LocalPackageReaderAdapter implements IPackageReaderPort {

  constructor(
    @inject(DIP_PARSER_TOKEN)
    private readonly parser: IDipParser,
    @inject(FILE_SYSTEM_PROVIDER_TOKEN)
    private readonly fileSystemProvider: IFileSystemProvider,
    @inject(DATA_MAPPER_TOKEN)
    private readonly mapper: IDataMapper,
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

  private async getParsedIndex(dipPath: string): Promise<any> {
    const filename = await this.resolveDipIndexFilename(dipPath);
    return this.parser.parse(
      await this.fileSystemProvider.readTextFile(
        path.join(dipPath, filename),
      ),
    );
  }

  private async getOptionalMetadata(dipPath: string, relativePath: string | null): Promise<any> {
    if (!relativePath) return null;
    try {
      const fullPath = path.join(dipPath, relativePath);
      const content = await this.fileSystemProvider.readTextFile(fullPath);
      return this.parser.parse(content);
    } catch {
      return null;
    }
  }

  public async readDip(dipPath: string): Promise<Dip> {
    const rawDipIndex = await this.getParsedIndex(dipPath);
    return this.mapper.mapDip(rawDipIndex);
  }

  public async *readDocumentClasses(
    dipPath: string,
  ): AsyncGenerator<DocumentClass> {
    const rawDipIndex = await this.getParsedIndex(dipPath);
    for (const dc of this.mapper.mapDocumentClasses(rawDipIndex)) {
      yield dc;
    }
  }

  public async *readProcesses(dipPath: string): AsyncGenerator<Process> {
    const rawDipIndex = await this.getParsedIndex(dipPath);
    const mappers = this.mapper.getProcessMappers(rawDipIndex);
    
    for (const req of mappers) {
      const rawMetadata = await this.getOptionalMetadata(dipPath, req.metadataRelativePath);
      yield req.map(rawMetadata);
    }
  }

  public async *readDocuments(dipPath: string): AsyncGenerator<Document> {
    const rawDipIndex = await this.getParsedIndex(dipPath);
    const mappers = this.mapper.getDocumentMappers(rawDipIndex);
    
    for (const req of mappers) {
      const rawMetadata = await this.getOptionalMetadata(dipPath, req.metadataRelativePath);
      yield req.map(rawMetadata);
    }
  }

  public async *readFiles(dipPath: string): AsyncGenerator<File> {
    const rawDipIndex = await this.getParsedIndex(dipPath);
    const mappers = this.mapper.getFileMappers(rawDipIndex);

    for (const req of mappers) {
      const rawMetadata = await this.getOptionalMetadata(dipPath, req.metadataRelativePath);
      yield req.map(rawMetadata);
    }
  }

  public async readFileBytes(filePath: string): Promise<NodeJS.ReadableStream> {
    return this.fileSystemProvider.openReadStream(filePath);
  }
}
