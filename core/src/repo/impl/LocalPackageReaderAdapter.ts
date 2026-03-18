import * as fs from "node:fs";
import * as path from "node:path";
import { Readable } from "node:stream";
import { IPackageReaderPort } from "../IPackageReaderPort";
import { IDipParser } from "./utils/IDipParser";
import { Dip } from "../../entity/Dip";
import { DocumentClass } from "../../entity/DocumentClass";
import { Process } from "../../entity/Process";
import { Document } from "../../entity/Document";
import { File } from "../../entity/File";
import { DipIndexMapper } from "./utils/DipIndexMapper";
import { PlatformPath } from "node:path";

const DIP_INDEX_FILENAME = "DiPIndex.xml";

export class LocalPackageReaderAdapter implements IPackageReaderPort {
  private readonly mapperCache = new Map<string, DipIndexMapper>();

  constructor(private readonly parser: IDipParser) {}

  private getMapper(dipPath: PlatformPath): DipIndexMapper {
    const key = dipPath as unknown as string;
    const cached = this.mapperCache.get(key);
    if (cached) return cached;

    const indexPath = path.join(key, DIP_INDEX_FILENAME);
    const rawContent = fs.readFileSync(indexPath, "utf-8");
    const mapper = new DipIndexMapper(this.parser.parseDipIndex(rawContent));
    this.mapperCache.set(key, mapper);
    return mapper;
  }

  public async *readDip(dipPath: PlatformPath): AsyncGenerator<Dip> {
    const mapper = this.getMapper(dipPath);
    yield new Dip(mapper.extractDipUuid());
  }

  public async *readDocumentClasses(
    dipPath: PlatformPath,
  ): AsyncGenerator<DocumentClass> {
    const mapper = this.getMapper(dipPath);
    // dipId is not yet known (assigned by DB), use 0 as placeholder.
    // The use-case layer will set the correct dipId after persisting the Dip.
    for (const dc of mapper.extractDocumentClasses()) {
      yield new DocumentClass(0, dc["@_uuid"], dc["@_name"], dc["@_validFrom"]);
    }
  }

  public async *readProcesses(dipPath: PlatformPath): AsyncGenerator<Process> {
    const mapper = this.getMapper(dipPath);
    for (const proc of mapper.extractProcesses()) {
      yield new Process(0, proc.uuid, proc.metadata);
    }
  }

  public async *readDocuments(dipPath: PlatformPath): AsyncGenerator<Document> {
    const mapper = this.getMapper(dipPath);
    for (const doc of mapper.extractDocuments()) {
      const metadataPath = path.join(
        dipPath as unknown as string,
        doc.documentPath,
        doc.metadataFilename,
      );
      const metadata = this.parser.parseDocumentMetadata(
        fs.readFileSync(metadataPath, "utf-8"),
      );
      yield new Document(doc.uuid, metadata, 0);
    }
  }

  public async *readFiles(dipPath: PlatformPath): AsyncGenerator<File> {
    const mapper = this.getMapper(dipPath);
    for (const file of mapper.extractFiles()) {
      yield new File(file.filename, file.path, file.isMain, 0);
    }
  }

  public readFileBytes(filePath: PlatformPath): ReadableStream {
    const nodeStream = fs.createReadStream(filePath as unknown as string);
    return Readable.toWeb(nodeStream) as ReadableStream;
  }
}
