export const FILE_SYSTEM_PROVIDER_TOKEN = Symbol("IFileSystemPort");

export interface IFileSystemPort {
  readFile: (filePath: string) => Promise<Uint8Array>;
  openReadStream: (filePath: string) => Promise<NodeJS.ReadableStream>;
  readTextFile: (filePath: string) => Promise<string>;
  fileExists: (filePath: string) => Promise<boolean>;
  listFiles: (dirPath: string) => Promise<string[]>;
}
