import { Readable } from "node:stream";
import { LocalExportPort } from "../../../src/repo/impl/LocalExportPort";
const fs = require("fs");

describe("LocalExportPort", () => {
  it("should pipe data to file system", async () => {
    const port = new LocalExportPort();
    const data = "test";
    const stream = Readable.from(data);
    const destPath = "test-output.txt";

    const result = await port.exportFile(stream, destPath);
    expect(result.success).toBe(true);

    const fileContent = fs.readFileSync(destPath, "utf-8");
    expect(fileContent).toBe(data);

    fs.unlinkSync(destPath);
  });

  it("should return error result on write failure", async () => {
    const port = new LocalExportPort();
    const data = "test";
    const stream = Readable.from(data);
    const destPath = "/invalid-path/test-output.txt";

    const result = await port.exportFile(stream, destPath);
    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("WRITE_ERROR");
  });
});
