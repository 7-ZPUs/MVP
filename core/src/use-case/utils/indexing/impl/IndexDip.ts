import { IIndexDipUC } from "../IIndexDip";
import { IndexResult } from "../IndexResult";
import {
  IPackageReaderService,
  PACKAGE_READER_PORT_TOKEN,
} from "../../../../services/IPackageReaderService";
import {
  DOCUMENT_CLASS_SAVE_PORT_TOKEN,
  ISaveDocumentClassPort,
} from "../../../../repo/IDocumentClassRepository";
import {
  ISaveProcessPort,
  PROCESS_SAVE_PORT_TOKEN,
} from "../../../../repo/IProcessRepository";
import {
  DOCUMENT_SAVE_PORT_TOKEN,
  ISaveDocumentPort,
} from "../../../../repo/IDocumentRepository";
import {
  FILE_SAVE_PORT_TOKEN,
  ISaveFilePort,
} from "../../../../repo/IFileRepository";
import {
  ITransactionManager,
  TRANSACTION_MANAGER_TOKEN,
} from "../../../../repo/ITransactionManager";
import {
  DIP_SAVE_PORT_TOKEN,
  ISaveDipPort,
} from "../../../../repo/IDipRepository";
import {
  ISaveVectorPort,
  VECTOR_SAVE_PORT_TOKEN,
} from "../../../../repo/IVectorRepository";
import {
  DOCUMENT_CHUNKER_TOKEN,
  IEmbeddingService,
} from "../../../../services/IEmbeddingService";
import { inject, injectable } from "tsyringe";
import { Vector } from "../../../../entity/Vector";
import { File } from "../../../../entity/File";

/*
 * Implementation of the IndexDip use case.
 * this class is responsible of piping the data from the package reader to the repositories.
 * Use the IndexDipBuilder to create an instance of this class with the required dependencies.
 */
@injectable()
export class IndexDipUC implements IIndexDipUC {
  private hasLoggedVectorWarning = false;
  private dipPath!: string;
  constructor(
    @inject(PACKAGE_READER_PORT_TOKEN)
    private readonly packageReader: IPackageReaderService,
    @inject(DIP_SAVE_PORT_TOKEN)
    private readonly dipRepository: ISaveDipPort,
    @inject(DOCUMENT_CLASS_SAVE_PORT_TOKEN)
    private readonly documentClassRepository: ISaveDocumentClassPort,
    @inject(PROCESS_SAVE_PORT_TOKEN)
    private readonly processRepository: ISaveProcessPort,
    @inject(DOCUMENT_SAVE_PORT_TOKEN)
    private readonly documentRepository: ISaveDocumentPort,
    @inject(FILE_SAVE_PORT_TOKEN)
    private readonly fileRepository: ISaveFilePort,
    @inject(VECTOR_SAVE_PORT_TOKEN)
    private readonly vectorRepository: ISaveVectorPort,
    @inject(DOCUMENT_CHUNKER_TOKEN)
    private readonly embeddingService: IEmbeddingService,
    @inject(TRANSACTION_MANAGER_TOKEN)
    private readonly transactionManager: ITransactionManager,
  ) {}
  public async execute(dipPath: string): Promise<IndexResult> {
    this.dipPath = dipPath;
    await this.packageReader.setDipPath(dipPath);
    return this.transactionManager.runInTransaction(async () => {
      await this.indexDip();
      await this.indexDocumentClasses();
      await this.indexProcesses();
      await this.indexDocuments();
      await this.indexFiles();
      return { success: true };
    });
  }

  private async indexDip(): Promise<IndexResult> {
    const dip = await this.packageReader.readDip();
    this.dipRepository.save(dip);
    return { success: true };
  }

  private async indexDocumentClasses(): Promise<IndexResult> {
    for await (const documentClass of this.packageReader.readDocumentClasses()) {
      this.documentClassRepository.save(documentClass);
    }
    return { success: true };
  }

  private async indexProcesses(): Promise<IndexResult> {
    for await (const process of this.packageReader.readProcesses()) {
      this.processRepository.save(process);
    }
    return { success: true };
  }

  private async indexDocuments(): Promise<IndexResult> {
    for await (const document of this.packageReader.readDocuments()) {
      this.documentRepository.save(document);
    }
    return { success: true };
  }

  private async indexFiles(): Promise<IndexResult> {
    for await (const file of this.packageReader.readFiles()) {
      const savedFile = this.fileRepository.save(file);
      if (!savedFile.getIsMain()) {
        continue;
      }

      await this.indexMainFileVector(savedFile);
    }
    return { success: true };
  }

  private async indexMainFileVector(file: File): Promise<void> {
    if (!file.getDocumentId()) {
      console.warn("Error occurred while indexing main file vector.");
      return;
    }
    try {
      const embedding = await this.embeddingService.generateDocumentEmbedding(
        file,
      );

      if (!embedding) {
        return;
      }

      await this.vectorRepository.saveVector(
        new Vector(file.getDocumentId() as number, embedding),
      );
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
