import * as path from "node:path";
import { IPackageReaderPort } from "../IPackageReaderPort";
import { DIP_PARSER_TOKEN, IDipParser } from "./utils/IDipParser";
import { Dip } from "../../entity/Dip";
import { DocumentClass } from "../../entity/DocumentClass";
import { Process } from "../../entity/Process";
import { Document } from "../../entity/Document";
import { File } from "../../entity/File";
import { Metadata } from "../../value-objects/Metadata";
import {
  FILE_SYSTEM_PROVIDER_TOKEN,
  type IFileSystemProvider,
} from "./utils/IFileSystemProvider";
import type { ParsedDipIndex } from "./utils/IDipParser";
import { inject, injectable } from "tsyringe";

const DIP_INDEX_FILENAME_REGEX = /^DiPIndex\..+\.xml$/;

@injectable()
export class LocalPackageReaderAdapter implements IPackageReaderPort {
  private currentDipPath?: string;

  private currentParsedIndex?: ParsedDipIndex;

  constructor(
    @inject(DIP_PARSER_TOKEN)
    private readonly parser: IDipParser,
    @inject(FILE_SYSTEM_PROVIDER_TOKEN)
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
      yield new DocumentClass(
        parsedIndex.dipUuid,
        dc.uuid,
        dc.name,
        dc.timestamp as string,
      );
    }
  }

  public async *readProcesses(dipPath: string): AsyncGenerator<Process> {
    const parsedIndex = await this.getParsedIndex(dipPath);
    for (const proc of parsedIndex.processes) {
      const aipInfoPath = path.join(
        dipPath,
        proc.aipRoot,
        `AiPInfo.${proc.uuid}.xml`,
      );
      let metadata: Metadata[] = [];
      try {
        metadata = this.parser.parseProcessMetadata(
          await this.fileSystemProvider.readTextFile(aipInfoPath),
        );
      } catch {
        // Fallback to possible metadata from DiPIndex parsing if AiPInfo fails or is missing
        metadata = proc.metadata || [];
      }
      yield new Process(proc.documentClassUuid, proc.uuid, metadata);
    }
  }

  public async *readDocuments(dipPath: string): AsyncGenerator<Document> {
    const parsedIndex = await this.getParsedIndex(dipPath);
    const processAipRootByUuid = new Map(
      parsedIndex.processes.map((process) => [process.uuid, process.aipRoot]),
    );
    for (const doc of parsedIndex.documents) {
      const aipRoot = processAipRootByUuid.get(doc.processUuid) ?? "";
      let metadataPath = path.join(
        aipRoot,
        doc.documentPath,
        doc.metadataFilename,
      );
      if (aipRoot && doc.documentPath.startsWith(aipRoot)) {
        metadataPath = path.join(doc.documentPath, doc.metadataFilename);
      }
      metadataPath = path.join(dipPath, metadataPath);
      let metadata: Metadata[] = [];
      try {
        metadata = this.parser.parseDocumentMetadata(
          await this.fileSystemProvider.readTextFile(metadataPath),
        );
      } catch {
        metadata = [];
      }
      yield new Document(doc.uuid, metadata, doc.processUuid);
    }
  }

  public async *readFiles(dipPath: string): AsyncGenerator<File> {
    const parsedIndex = await this.getParsedIndex(dipPath);
    const processAipRootByUuid = new Map(
      parsedIndex.processes.map((process) => [process.uuid, process.aipRoot]),
    );
    const documentAipRootByUuid = new Map(
      parsedIndex.documents.map((document) => [
        document.uuid,
        processAipRootByUuid.get(document.processUuid) ?? "",
      ]),
    );
    for (const file of parsedIndex.files) {
      const aipRoot = documentAipRootByUuid.get(file.documentUuid) ?? "";
      let fullPath = file.path;
      if (aipRoot && !file.path.startsWith(aipRoot)) {
        fullPath = path.join(aipRoot, file.path);
      }
      yield new File(
        file.filename,
        fullPath,
        "",
        file.isMain,
        file.documentUuid,
      );
    }
  }

  public async readFileBytes(filePath: string): Promise<NodeJS.ReadableStream> {
    return this.fileSystemProvider.openReadStream(filePath);
  }
}
