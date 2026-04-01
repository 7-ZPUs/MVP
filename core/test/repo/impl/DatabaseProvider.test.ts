import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockDb, mockCtor, mockHomedir, mockMkdirSync } = vi.hoisted(() => ({
  mockDb: {
    pragma: vi.fn(),
    loadExtension: vi.fn(),
  },
  mockCtor: vi.fn(),
  mockHomedir: vi.fn(),
  mockMkdirSync: vi.fn(),
}));

vi.mock("better-sqlite3", () => ({
  default: mockCtor.mockImplementation(() => mockDb),
}));

vi.mock("node:os", () => ({
  homedir: mockHomedir,
}));

vi.mock("node:fs", () => ({
  mkdirSync: mockMkdirSync,
}));

import { DatabaseProvider } from "../../../src/repo/impl/DatabaseProvider";
import Database from "better-sqlite3";
import * as os from "node:os";
import * as fs from "node:fs";

describe("DatabaseProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // identifier: TU-F-browsing-41
  // method_name: constructor
  // description: should use explicitly provided dbPath
  // expected_value: matches asserted behavior: use explicitly provided dbPath
  it("TU-F-browsing-41: constructor should use explicitly provided dbPath", () => {
    const dbPath = "/custom/path/to/db.sqlite";
    const provider = new DatabaseProvider(dbPath);

    const db = provider.getDb();

    expect(fs.mkdirSync).toHaveBeenCalledWith("/custom/path/to", {
      recursive: true,
    });
    expect(Database).toHaveBeenCalledWith(dbPath);
    expect(db).toBeDefined();
  });

  // identifier: TU-F-browsing-42
  // method_name: constructor
  // description: should fallback to homedir if no string is provided for dbPath
  // expected_value: matches asserted behavior: fallback to homedir if no string is provided for dbPath
  it("TU-F-browsing-42: constructor should fallback to homedir if no string is provided for dbPath", () => {
    const mockHomeDir = "/home/user";
    vi.mocked(os.homedir).mockReturnValue(mockHomeDir);

    const provider = new DatabaseProvider();
    const db = provider.getDb();

    expect(fs.mkdirSync).toHaveBeenCalledWith("/home/user/.dip-viewer", {
      recursive: true,
    });

    expect(Database).toHaveBeenCalledWith(
      "/home/user/.dip-viewer/dip-viewer.db",
    );
    expect(db).toBeDefined();
  });

  // identifier: TU-F-browsing-43
  // method_name: db
  // description: should return the same db instance on subsequent calls
  // expected_value: returns the same db instance on subsequent calls
  it("TU-F-browsing-43: db should return the same db instance on subsequent calls", () => {
    const dbPath = "/custom/path/to/db.sqlite";

    const provider = new DatabaseProvider(dbPath);
    const db1 = provider.getDb();
    const db2 = provider.getDb();

    expect(Database).toHaveBeenCalledTimes(1);
    expect(db1).toBe(db2);
  });
});
