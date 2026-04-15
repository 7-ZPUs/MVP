import { File } from "../entity/File";
import { IEmbeddingConfiguration } from "./impl/EmbeddingService";

export const DOCUMENT_CHUNKER_TOKEN = Symbol("IEmbeddingService");

export interface IEmbeddingService {
  generateDocumentEmbedding(file: File): Promise<Float32Array | null>;
  setEmbeddingConfiguration(config: IEmbeddingConfiguration): void;
}
