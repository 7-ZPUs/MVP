import { describe, it, expect, vi, beforeEach } from "vitest";
import { FileSystemProvider } from "../../../src/repo/impl/utils/FileSystemProvider";
import * as fs from "node:fs";
import { readFile } from "node:fs/promises";

vi.mock("node:fs", () => {
  return {
    createReadStream: vi.fn(),
    promises: {
      access: vi.fn(),
      readdir: vi.fn(),
    },
    constants: {
      F_OK: 0,
    },
  };
});

vi.mock("node:fs/promises", () => {
  return {
    readFile: vi.fn(),
  };
});

describe("FileSystemProvider", () => {
  let provider: FileSystemProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new FileSystemProvider();
  });

  // identifier: TU-F-B-100
  // method_name: readFile()
  // description: should return Uint8Array
  // expected_value: returns Uint8Array
  it("readFile should return Uint8Array", async () => {
    const buffer = Buffer.from([1, 2, 3]);
    vi.mocked(readFile).mockResolvedValueOnce(buffer);

    const result = await provider.readFile("test.txt");

    expect(result).toBeInstanceOf(Uint8Array);
    expect(readFile).toHaveBeenCalledWith("test.txt");
    expect(result).toEqual(new Uint8Array(buffer));
  });

  // identifier: TU-F-B-101
  // method_name: openReadStream()
  // description: should return a readable stream
  // expected_value: returns a readable stream
  it("openReadStream should return a readable stream", async () => {
    const mockStream = {} as NodeJS.ReadableStream;
    vi.mocked(fs.createReadStream).mockReturnValueOnce(mockStream as any);

    const result = await provider.openReadStream("test.txt");

    expect(fs.createReadStream).toHaveBeenCalledWith("test.txt");
    expect(result).toBe(mockStream);
  });

  // identifier: TU-F-B-102
  // method_name: readTextFile()
  // description: should return read value
  // expected_value: returns read value
  it("readTextFile should return read value", async () => {
    const textData = "test content";
    vi.mocked(readFile).mockResolvedValueOnce(textData);

    const result = await provider.readTextFile("test.txt");

    expect(readFile).toHaveBeenCalledWith("test.txt", "utf-8");
    expect(result).toBe(textData);
  });

  // identifier: TU-F-B-103
  // method_name: fileExists()
  // description: should return true if access succeeds
  // expected_value: returns true if access succeeds
  it("fileExists should return true if access succeeds", async () => {
    vi.mocked(fs.promises.access).mockResolvedValueOnce(undefined);

    const result = await provider.fileExists("test.txt");

    expect(fs.promises.access).toHaveBeenCalledWith(
      "test.txt",
      fs.constants.F_OK,
    );
    expect(result).toBe(true);
  });

  // identifier: TU-F-B-104
  // method_name: fileExists()
  // description: should return false if access fails
  // expected_value: returns false if access fails
  it("fileExists should return false if access fails", async () => {
    vi.mocked(fs.promises.access).mockRejectedValueOnce(new Error("No access"));

    const result = await provider.fileExists("test.txt");

    expect(fs.promises.access).toHaveBeenCalledWith(
      "test.txt",
      fs.constants.F_OK,
    );
    expect(result).toBe(false);
  });

  // identifier: TU-F-B-105
  // method_name: listFiles()
  // description: should return directory contents
  // expected_value: returns directory contents
  it("listFiles should return directory contents", async () => {
    const files = ["file1.txt", "file2.txt"];
    vi.mocked(fs.promises.readdir).mockResolvedValueOnce(files as any);

    const result = await provider.listFiles("test-dir");

    expect(fs.promises.readdir).toHaveBeenCalledWith("test-dir");
    expect(result).toEqual(files);
  });
});
