import * as path from "node:path";
import { IPackageReaderPort } from "../IPackageReaderPort";
import { IDipParser } from "./utils/IDipParser";
import { Dip } from "../../entity/Dip";
import { DocumentClass } from "../../entity/DocumentClass";
import { Process } from "../../entity/Process";
import { Document } from "../../entity/Document";
import { File } from "../../entity/File";
import { DipIndexMapper } from "./utils/DipIndexMapper";
import type { IFileSystemProvider } from "./utils/IFileSystemProvider";

const DIP_INDEX_FILENAME_REGEX = /^DiPIndex\..+\.xml$/;
type MapperFactory = (
  dipPath: string,
) => DipIndexMapper | Promise<DipIndexMapper>;

export class LocalPackageReaderAdapter implements IPackageReaderPort {
  private readonly mapperCache = new Map<string, DipIndexMapper>();

  private readonly mapperFactory?: MapperFactory;

  constructor(
    private readonly parser: IDipParser,
    private readonly fileSystemProvider: IFileSystemProvider,
    mapperFactory?: MapperFactory,
  ) {
    this.mapperFactory = mapperFactory;
  }

  private async resolveDipIndexFilename(dipPath: string): Promise<string> {
    const files = await this.fileSystemProvider.listFiles(dipPath);
    const filename = files
      .filter((file) => DIP_INDEX_FILENAME_REGEX.test(file))
      .sort()[0];

    if (!filename) {
      throw new Error(
        `DiP index file not found in '${dipPath}'. Expected format: DiPIndex.<uuid>.xml`,
      );
    }

    return filename;
  }

  private async getMapper(dipPath: string): Promise<DipIndexMapper> {
    const key = dipPath;
    const cached = this.mapperCache.get(key);
    if (cached) return cached;

    const mapperFromFactory = await this.mapperFactory?.(key);
    const mapper =
      mapperFromFactory ??
      new DipIndexMapper(
        this.parser.parseDipIndex(
          await this.fileSystemProvider.readTextFile(
            path.join(key, await this.resolveDipIndexFilename(key)),
          ),
        ),
      );
    this.mapperCache.set(key, mapper);
    return mapper;
  }

  public async readDip(dipPath: string): Promise<Dip> {
    const mapper = await this.getMapper(dipPath);
    return new Dip(mapper.extractDipUuid());
  }

  public async *readDocumentClasses(
    dipPath: string,
  ): AsyncGenerator<DocumentClass> {
    const mapper = await this.getMapper(dipPath);
    for (const dc of mapper.extractDocumentClasses()) {
      yield new DocumentClass(0, dc["@_uuid"], dc["@_name"], dc["@_validFrom"]);
    }
  }

  public async *readProcesses(dipPath: string): AsyncGenerator<Process> {
    const mapper = await this.getMapper(dipPath);
    for (const proc of mapper.extractProcesses()) {
      yield new Process(0, proc.uuid, proc.metadata);
    }
  }

  public async *readDocuments(dipPath: string): AsyncGenerator<Document> {
    const mapper = await this.getMapper(dipPath);
    for (const doc of mapper.extractDocuments()) {
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
    const mapper = await this.getMapper(dipPath);
    for (const file of mapper.extractFiles()) {
      yield new File(file.filename, file.path, "", file.isMain, 0);
    }
  }

  public async readFileBytes(filePath: string): Promise<ReadableStream> {
    return this.fileSystemProvider.openReadStream(filePath);
  }
}
