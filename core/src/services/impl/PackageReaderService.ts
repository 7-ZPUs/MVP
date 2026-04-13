import * as path from "node:path";
import { IPackageReaderService } from "../IPackageReaderService";
import { DIP_PARSER_TOKEN, IDipParser } from "../../repo/impl/utils/IDipParser";
import { Dip } from "../../entity/Dip";
import { DocumentClass } from "../../entity/DocumentClass";
import { Process } from "../../entity/Process";
import { Document } from "../../entity/Document";
import { File } from "../../entity/File";
import {
  FILE_SYSTEM_PROVIDER_TOKEN,
  type IFileSystemPort,
} from "../../repo/impl/utils/IFileSystemProvider";
import { inject, injectable } from "tsyringe";
import {
  DATA_MAPPER_TOKEN,
  IDataMapper,
} from "../../repo/impl/utils/IDataMapper";

const DIP_INDEX_FILENAME_REGEX = /^DiPIndex\..+\.xml$/;

@injectable()
export class PackageReaderService implements IPackageReaderService {
  private dipPath: string | null = null;

  constructor(
    @inject(DIP_PARSER_TOKEN)
    private readonly parser: IDipParser,
    @inject(FILE_SYSTEM_PROVIDER_TOKEN)
    private readonly fileSystemProvider: IFileSystemPort,
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
      await this.fileSystemProvider.readTextFile(path.join(dipPath, filename)),
    );
  }

  private async getOptionalMetadata(relativePath: string | null): Promise<any> {
    if (!relativePath || !this.dipPath) return null;
    try {
      const fullPath = path.join(this.dipPath, relativePath);
      const content = await this.fileSystemProvider.readTextFile(fullPath);
      return this.parser.parse(content);
    } catch {
      return null;
    }
  }

  public async readDip(): Promise<Dip> {
    return this.mapper.mapDip();
  }

  public async *readDocumentClasses(): AsyncGenerator<DocumentClass> {
    for (const dc of this.mapper.mapDocumentClasses()) {
      yield dc;
    }
  }

  public async *readProcesses(): AsyncGenerator<Process> {
    const mappers = this.mapper.getProcessMappers();

    for (const req of mappers) {
      const rawMetadata = await this.getOptionalMetadata(
        req.metadataRelativePath,
      );
      yield req.map(rawMetadata);
    }
  }

  public async *readDocuments(): AsyncGenerator<Document> {
    const mappers = this.mapper.getDocumentMappers();

    for (const req of mappers) {
      const rawMetadata = await this.getOptionalMetadata(
        req.metadataRelativePath,
      );
      yield req.map(rawMetadata);
    }
  }

  public async *readFiles(): AsyncGenerator<File> {
    const mappers = this.mapper.getFileMappers();

    for (const req of mappers) {
      const rawMetadata = await this.getOptionalMetadata(
        req.metadataRelativePath,
      );
      yield req.map(rawMetadata);
    }
  }

  public async readFileBytes(filePath: string): Promise<NodeJS.ReadableStream> {
    if (!this.dipPath) {
      throw new Error("DiP path is not set.");
    }
    const absolutePath = path.resolve(this.dipPath, filePath);
    return this.fileSystemProvider.openReadStream(absolutePath);
  }

  public async setDipPath(dipPath: string): Promise<void> {
    this.dipPath = dipPath;
    this.mapper.setRawDipIndex(await this.getParsedIndex(dipPath));
  }
}
