export interface IFileSystemProvider {
  readFile: (filePath: string) => Promise<Uint8Array>;
  openReadStream: (filePath: string) => Promise<Readable>;
  readTextFile: (filePath: string) => Promise<string>;
  fileExists: (filePath: string) => Promise<boolean>;
}
