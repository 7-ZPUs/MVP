import { injectable } from "tsyringe";
import * as path from "node:path";
import * as fs from "node:fs";
import * as os from "node:os";
import { app } from "electron";
import { IWordEmbedding } from "../IWordEmbedding";

type TransformersModule = typeof import("@xenova/transformers");

// Keep runtime import() semantics even when compiling to CommonJS.
// This avoids TS downleveling to require(), which breaks on ESM-only packages.
const dynamicImport = new Function("specifier", "return import(specifier)") as (
  specifier: string,
) => Promise<TransformersModule>;

const isVitestRuntime = process.env["VITEST"] === "true";

const isDev = app?.isPackaged;
const modelsPath = isDev
  ? path.join(__dirname, "..", "..", "models", "Xenova")
  : path.join(process.resourcesPath, "models", "Xenova");

const numThreads = Math.max(1, Math.floor(os.cpus().length));

@injectable()
export class WordEmbedding implements IWordEmbedding {
  private embedder: unknown = null;
  private initialized = false;

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    if (!fs.existsSync(modelsPath)) {
      throw new Error(`[AI] Cartella modelli non trovata: ${modelsPath}`);
    }

    // In test runtime use plain import so Vitest can mock the module.
    // In app runtime use function-based dynamic import to avoid CJS require() downleveling.
    const { pipeline, env } = isVitestRuntime
      ? await import("@xenova/transformers")
      : await dynamicImport("@xenova/transformers");

    env.localModelPath = modelsPath;
    env.allowLocalModels = true;
    env.allowRemoteModels = false;
    env.useBrowserCache = false;
    env.backends.onnx.executionProviders = ["cpu"];

    if (env.backends.onnx.wasm) {
      env.backends.onnx.wasm.numThreads = numThreads;
    }

    this.embedder = await pipeline(
      "feature-extraction",
      "paraphrase-multilingual-MiniLM-L12-v2",
      { quantized: true, local_files_only: true },
    );

    this.initialized = true;
    console.log("[AI] Modello caricato.");
  }

  async generateEmbedding(text: string): Promise<Float32Array> {
    if (!this.embedder) {
      await this.initialize();
    }
    const output = await (
      this.embedder as (
        input: string,
        options: { pooling: "mean"; normalize: true },
      ) => Promise<{ data: Float32Array }>
    )(text, { pooling: "mean", normalize: true });
    return output.data;
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}
