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
  ITransactionManager,
  TRANSACTION_MANAGER_TOKEN,
} from "../../../../repo/ITransactionManager";
import {
  IDipRepository,
  DIP_REPOSITORY_TOKEN,
} from "../../../../repo/IDipRepository";
import { IVectorRepository } from "../../../../repo/IVectorRepository";
import { VECTOR_REPOSITORY_TOKEN } from "../../../../repo/VectorRepositoryToken";
import {
  DOCUMENT_CHUNKER_TOKEN,
  IDocumentChunker,
} from "../../../../services/IDocumentChunker";
import { inject, injectable } from "tsyringe";
import path from "node:path";
import { Vector } from "../../../../entity/Vector";

/*
 * Implementation of the IndexDip use case.
 * this class is responsible of piping the data from the package reader to the repositories.
 * Use the IndexDipBuilder to create an instance of this class with the required dependencies.
 */
@injectable()
export class IndexDip implements IIndexDip {
  private hasLoggedVectorWarning = false;

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
    @inject(VECTOR_REPOSITORY_TOKEN)
    private readonly vectorRepository: IVectorRepository,
    @inject(DOCUMENT_CHUNKER_TOKEN)
    private readonly documentChunker: IDocumentChunker,
    @inject(TRANSACTION_MANAGER_TOKEN)
    private readonly transactionManager: ITransactionManager,
  ) {}
  public async execute(dipPath: string): Promise<IndexResult> {
    return this.transactionManager.runInTransaction(async () => {
      await this.indexDip(dipPath);
      await this.indexDocumentClasses(dipPath);
      await this.indexProcesses(dipPath);
      await this.indexDocuments(dipPath);
      await this.indexFiles(dipPath);
      return { success: true };
    });
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
      const savedFile = this.fileRepository.save(file);
      if (!savedFile.getIsMain()) {
        continue;
      }

      await this.indexMainFileVector(
        dipPath,
        savedFile.getPath(),
        savedFile.getDocumentId(),
      );
    }
    return { success: true };
  }

  private async indexMainFileVector(
    dipPath: string,
    relativeFilePath: string,
    documentId: number | null,
  ): Promise<void> {
    if (documentId === null) {
      return;
    }

    const absoluteFilePath = path.join(dipPath, relativeFilePath);
    try {
      const embedding = await this.documentChunker.generateDocumentEmbedding(
        absoluteFilePath,
      );

      if (!embedding) {
        return;
      }

      await this.vectorRepository.saveVector(new Vector(documentId, embedding));
    } catch (error) {
      try {
        if (!this.hasLoggedVectorWarning) {
          console.warn(
            "[INDEXING] Vector generation failed for at least one file:",
            error instanceof Error ? error.message : String(error),
          );
          console.warn(
            "[INDEXING] Additional vector-generation errors will be suppressed.",
          );
          this.hasLoggedVectorWarning = true;
        }
      } catch {
        // Never fail indexing because warning logging failed.
      }
    }
  }
}
