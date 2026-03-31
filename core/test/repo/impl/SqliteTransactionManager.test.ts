import { describe, expect, it, vi } from "vitest";

import { SqliteTransactionManager } from "../../../src/repo/impl/SqliteTransactionManager";
import type { DatabaseProvider } from "../../../src/repo/impl/DatabaseProvider";

describe("SqliteTransactionManager", () => {
  it("starts BEGIN IMMEDIATE TRANSACTION and COMMIT on success", async () => {
    const db = { exec: vi.fn() };
    const manager = new SqliteTransactionManager(
      { db } as unknown as DatabaseProvider,
    );

    const result = await manager.runInTransaction(async () => "ok");

    expect(result).toBe("ok");
    expect(db.exec.mock.calls).toEqual([
      ["BEGIN IMMEDIATE TRANSACTION"],
      ["COMMIT"],
    ]);
  });

  it("starts BEGIN IMMEDIATE TRANSACTION and ROLLBACK on failure", async () => {
    const db = { exec: vi.fn() };
    const manager = new SqliteTransactionManager(
      { db } as unknown as DatabaseProvider,
    );

    const error = new Error("boom");

    await expect(
      manager.runInTransaction(async () => {
        throw error;
      }),
    ).rejects.toBe(error);

    expect(db.exec.mock.calls).toEqual([
      ["BEGIN IMMEDIATE TRANSACTION"],
      ["ROLLBACK"],
    ]);
  });

  it("propagates caller values without altering them", async () => {
    const db = { exec: vi.fn() };
    const manager = new SqliteTransactionManager(
      { db } as unknown as DatabaseProvider,
    );

    const payload = { status: "result", count: 3 };

    const result = await manager.runInTransaction(async () => payload);

    expect(result).toBe(payload);
  });
});
