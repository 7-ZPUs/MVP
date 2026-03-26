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
import { DocumentMetadataHashMapper } from "./utils/DocumentMetadataHashMapper";
import { inject, injectable } from "tsyringe";

const DIP_INDEX_FILENAME_REGEX = /^DiPIndex\..+\.xml$/;

@injectable()
export class LocalPackageReaderAdapter implements IPackageReaderPort {
  private currentDipPath?: string;

  private currentParsedIndex?: ParsedDipIndex;

  private readonly currentDocumentMetadataByDocUuid = new Map<
    string,
    Metadata[]
  >();

  private readonly currentHashByFileUuid = new Map<string, string>();

  private readonly metadataHashMapper = new DocumentMetadataHashMapper();

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
    this.currentDocumentMetadataByDocUuid.clear();
    this.currentHashByFileUuid.clear();

    return parsedIndex;
  }

  private resolveMetadataPath(
    dipPath: string,
    aipRoot: string,
    documentPath: string,
    metadataFilename: string,
  ): string {
    let metadataPath = path.join(aipRoot, documentPath, metadataFilename);
    if (aipRoot && documentPath.startsWith(aipRoot)) {
      metadataPath = path.join(documentPath, metadataFilename);
    }
    return path.join(dipPath, metadataPath);
  }

  private async getOrReadDocumentMetadata(
    dipPath: string,
    doc: ParsedDipIndex["documents"][number],
    processAipRootByUuid: Map<string, string>,
  ): Promise<Metadata[]> {
    const cached = this.currentDocumentMetadataByDocUuid.get(doc.uuid);
    if (cached) {
      return cached;
    }

    const aipRoot = processAipRootByUuid.get(doc.processUuid) ?? "";
    const metadataPath = this.resolveMetadataPath(
      dipPath,
      aipRoot,
      doc.documentPath,
      doc.metadataFilename,
    );

    let metadata: Metadata[] = [];
    try {
      metadata = this.parser.parseDocumentMetadata(
        await this.fileSystemProvider.readTextFile(metadataPath),
      );
    } catch {
      metadata = [];
    }

    this.currentDocumentMetadataByDocUuid.set(doc.uuid, metadata);
    return metadata;
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
      const metadata = await this.getOrReadDocumentMetadata(
        dipPath,
        doc,
        processAipRootByUuid,
      );
      yield new Document(doc.uuid, metadata, doc.processUuid);
    }
  }

  public async *readFiles(dipPath: string): AsyncGenerator<File> {
    const parsedIndex = await this.getParsedIndex(dipPath);
    const processAipRootByUuid = new Map(
      parsedIndex.processes.map((process) => [process.uuid, process.aipRoot]),
    );
    const documentByUuid = new Map(
      parsedIndex.documents.map((doc) => [doc.uuid, doc]),
    );
    const mainFileUuidByDocumentUuid = new Map(
      parsedIndex.files
        .filter((file) => file.isMain)
        .map((file) => [file.documentUuid, file.uuid]),
    );
    for (const doc of parsedIndex.documents) {
      const metadata = await this.getOrReadDocumentMetadata(
        dipPath,
        doc,
        processAipRootByUuid,
      );
      const extractedHashes = this.metadataHashMapper.map(
        metadata,
        mainFileUuidByDocumentUuid.get(doc.uuid),
      );
      for (const [fileUuid, hash] of extractedHashes.entries()) {
        this.currentHashByFileUuid.set(fileUuid, hash);
      }
    }

    for (const file of parsedIndex.files) {
      const doc = documentByUuid.get(file.documentUuid);
      const aipRoot = doc
        ? (processAipRootByUuid.get(doc.processUuid) ?? "")
        : "";

      let fullPath = file.path;
      if (aipRoot && !file.path.startsWith(aipRoot)) {
        fullPath = path.join(aipRoot, file.path);
      }
      const hash = this.currentHashByFileUuid.get(file.uuid) ?? "";

      yield new File(
        file.filename,
        fullPath,
        hash,
        file.isMain,
        file.documentUuid,
      );
    }
  }

  public async readFileBytes(filePath: string): Promise<NodeJS.ReadableStream> {
    return this.fileSystemProvider.openReadStream(filePath);
  }
}
