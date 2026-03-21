export interface IFileSystemProvider {
  readFile: (filePath: string) => Promise<Uint8Array>;
  openReadStream: (filePath: string) => Promise<ReadableStream>;
  readTextFile: (filePath: string) => Promise<string>;
  openReadTextStream: (filePath: string) => Promise<ReadableStream>;
  fileExists: (filePath: string) => Promise<boolean>;
}
