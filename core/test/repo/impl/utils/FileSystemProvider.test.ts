import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { FileSystemPort } from "../../../../src/repo/impl/utils/FileSystemProvider";
import * as os from "node:os";
import * as path from "node:path";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";

describe("FileSystemProvider", () => {
  let provider: FileSystemPort;
  let tempDir: string;
  let existingFilePath: string;
  let testDirPath: string;

  beforeEach(async () => {
    provider = new FileSystemPort();
    tempDir = await mkdtemp(path.join(os.tmpdir(), "fsp-test-"));
    existingFilePath = path.join(tempDir, "sample.txt");
    testDirPath = path.join(tempDir, "nested");

    await writeFile(existingFilePath, "test content", "utf-8");
    await mkdir(testDirPath, { recursive: true });
    await writeFile(path.join(testDirPath, "file1.txt"), "one", "utf-8");
    await writeFile(path.join(testDirPath, "file2.txt"), "two", "utf-8");
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  // identifier: TU-F-browsing-70
  // method_name: readFile()
  // description: should return Uint8Array when reading an existing file from disk
  // expected_value: returns file bytes matching the content stored on disk
  it("TU-F-browsing-70: readFile() should return Uint8Array when reading an existing file from disk", async () => {
    const result = await provider.readFile(existingFilePath);

    expect(result).toBeInstanceOf(Uint8Array);
    expect(Buffer.from(result).toString("utf-8")).toBe("test content");
  });

  // identifier: TU-F-browsing-71
  // method_name: openReadStream()
  // description: should return a readable stream that reads actual file content
  // expected_value: returns stream chunks that reconstruct the file text
  it("TU-F-browsing-71: openReadStream() should return a readable stream that reads actual file content", async () => {
    const result = await provider.openReadStream(existingFilePath);

    let content = "";
    for await (const chunk of result) {
      content += chunk.toString();
    }

    expect(content).toBe("test content");
  });

  // identifier: TU-F-browsing-72
  // method_name: readTextFile()
  // description: should read utf-8 text from an existing file on disk
  // expected_value: returns the text persisted in the file
  it("TU-F-browsing-72: readTextFile() should read utf-8 text from an existing file on disk", async () => {
    const result = await provider.readTextFile(existingFilePath);

    expect(result).toBe("test content");
  });

  // identifier: TU-F-browsing-73
  // method_name: fileExists()
  // description: should return true for an existing path on disk
  // expected_value: returns true when the file is physically present
  it("TU-F-browsing-73: fileExists() should return true for an existing path on disk", async () => {
    const result = await provider.fileExists(existingFilePath);

    expect(result).toBe(true);
  });

  // identifier: TU-F-browsing-74
  // method_name: fileExists()
  // description: should return false for a non-existing path on disk
  // expected_value: returns false when the file is missing
  it("TU-F-browsing-74: fileExists() should return false for a non-existing path on disk", async () => {
    const missingFilePath = path.join(tempDir, "missing.txt");
    const result = await provider.fileExists(missingFilePath);

    expect(result).toBe(false);
  });

  // identifier: TU-F-browsing-75
  // method_name: listFiles()
  // description: should return directory contents from the real filesystem
  // expected_value: returns all created file names in the target directory
  it("TU-F-browsing-75: listFiles() should return directory contents from the real filesystem", async () => {
    const result = await provider.listFiles(testDirPath);

    expect(result.sort((a: string, b: string) => a.localeCompare(b))).toEqual([
      "file1.txt",
      "file2.txt",
    ]);
  });
});
