import { IIndexDip } from "../IIndexDip";
import { IndexResult } from "../IndexResult";
import {
  IPackageReaderPort,
  PACKAGE_READER_PORT_TOKEN,
} from "../../../../repo/IPackageReaderPort";
import {
  IDocumentClassRepository,
  DOCUMENT_CLASS_REPOSITORY_TOKEN,
} from "../../../../repo/IDocumentClassRepository";
import {
  IProcessRepository,
  PROCESS_REPOSITORY_TOKEN,
} from "../../../../repo/IProcessRepository";
import {
  IDocumentRepository,
  DOCUMENTO_REPOSITORY_TOKEN,
} from "../../../../repo/IDocumentRepository";
import {
  IFileRepository,
  FILE_REPOSITORY_TOKEN,
} from "../../../../repo/IFileRepository";
import {
  IDipRepository,
  DIP_REPOSITORY_TOKEN,
} from "../../../../repo/IDipRepository";
import { inject, injectable } from "tsyringe";

/*
 * Implementation of the IndexDip use case.
 * this class is responsible of piping the data from the package reader to the repositories.
 * Use the IndexDipBuilder to create an instance of this class with the required dependencies.
 */
@injectable()
export class IndexDip implements IIndexDip {
  constructor(
    @inject(PACKAGE_READER_PORT_TOKEN)
    private readonly packageReader: IPackageReaderPort,
    @inject(DIP_REPOSITORY_TOKEN)
    private readonly dipRepository: IDipRepository,
    @inject(DOCUMENT_CLASS_REPOSITORY_TOKEN)
    private readonly documentClassRepository: IDocumentClassRepository,
    @inject(PROCESS_REPOSITORY_TOKEN)
    private readonly processRepository: IProcessRepository,
    @inject(DOCUMENTO_REPOSITORY_TOKEN)
    private readonly documentRepository: IDocumentRepository,
    @inject(FILE_REPOSITORY_TOKEN)
    private readonly fileRepository: IFileRepository,
  ) {}
  public async execute(dipPath: string): Promise<IndexResult> {
    await this.indexDip(dipPath);
    await this.indexDocumentClasses(dipPath);
    await this.indexProcesses(dipPath);
    await this.indexDocuments(dipPath);
    await this.indexFiles(dipPath);
    return { success: true };
  }

  private async indexDip(dipPath: string): Promise<IndexResult> {
    const dip = await this.packageReader.readDip(dipPath);
    this.dipRepository.save(dip);
    return { success: true };
  }

  private async indexDocumentClasses(dipPath: string): Promise<IndexResult> {
    for await (const documentClass of this.packageReader.readDocumentClasses(
      dipPath,
    )) {
      this.documentClassRepository.save(documentClass);
    }
    return { success: true };
  }

  private async indexProcesses(dipPath: string): Promise<IndexResult> {
    for await (const process of this.packageReader.readProcesses(dipPath)) {
      this.processRepository.save(process);
    }
    return { success: true };
  }

  private async indexDocuments(dipPath: string): Promise<IndexResult> {
    for await (const document of this.packageReader.readDocuments(dipPath)) {
      this.documentRepository.save(document);
    }
    return { success: true };
  }

  private async indexFiles(dipPath: string): Promise<IndexResult> {
    for await (const file of this.packageReader.readFiles(dipPath)) {
      this.fileRepository.save(file);
    }
    return { success: true };
  }
}
