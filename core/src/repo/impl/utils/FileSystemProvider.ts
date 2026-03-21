import * as fs from "node:fs";
import { readFile } from "node:fs/promises";
import { Readable } from "node:stream";
import type { IFileSystemProvider } from "./IFileSystemProvider";

export class FileSystemProvider implements IFileSystemProvider {
  public async readFile(filePath: string): Promise<Uint8Array> {
    const file = await readFile(filePath);
    return new Uint8Array(file);
  }

  public async openReadStream(filePath: string): Promise<ReadableStream> {
    const nodeStream = fs.createReadStream(filePath);
    return Readable.toWeb(nodeStream) as ReadableStream;
  }

  public async readTextFile(filePath: string): Promise<string> {
    return readFile(filePath, "utf-8");
  }

  public async openReadTextStream(filePath: string): Promise<ReadableStream> {
    const nodeStream = fs.createReadStream(filePath, { encoding: "utf-8" });
    return Readable.toWeb(nodeStream) as ReadableStream;
  }

  public async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }
}
