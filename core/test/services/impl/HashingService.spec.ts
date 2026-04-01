import { describe, it, expect } from "vitest";
import { HashingService } from "../../../src/services/impl/HashingService";
import { Readable } from "stream";

describe("HashingService", () => {
  it("TU-S-browsing-57: checkFileIntegrity() should return VALID for a file with correct hash", async () => {
    const hs = new HashingService({
      readFileBytes: async (filePath: string) => {
        const content = "Hello, World!";
        const buffer = Buffer.from(content, "utf-8");
        return Readable.from(buffer);
      },
    } as any);

    const expectedHash = "3/1gIbsr1bCvZ2KQgJ7DpTGR3YHH9wpLKGiKNiGCmG8="; // SHA-256 Base64 of "Hello, World!"
    const result = await hs.checkFileIntegrity("dummy/path.txt", expectedHash);
    expect(result).toBe("VALID");
  });

  it("TU-S-browsing-58: checkFileIntegrity() should return INVALID for a file with incorrect hash", async () => {
    const hs = new HashingService({
      readFileBytes: async (filePath: string) => {
        const content = "Hello, World!";
        const buffer = Buffer.from(content, "utf-8");
        return Readable.from(buffer);
      },
    } as any);

    const expectedHash = "incorrectHash==";
    const result = await hs.checkFileIntegrity("dummy/path.txt", expectedHash);
    expect(result).toBe("INVALID");
  });

  it("TU-S-browsing-59: checkFileIntegrity() should handle empty files", async () => {
    const hs = new HashingService({
      readFileBytes: async (filePath: string) => {
        const buffer = Buffer.from("", "utf-8");
        return Readable.from(buffer);
      },
    } as any);

    const expectedHash = "47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU="; // SHA-256 Base64 of empty string
    const result = await hs.checkFileIntegrity("dummy/empty.txt", expectedHash);
    expect(result).toBe("VALID");
  });
});
