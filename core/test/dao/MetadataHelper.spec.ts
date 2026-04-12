import { afterEach, beforeEach, describe, expect, it } from "vitest";

import Database from "better-sqlite3";

import { loadMetadata, saveMetadata } from "../../src/dao/MetadataHelper";
import { Metadata, MetadataType } from "../../src/value-objects/Metadata";

describe("MetadataHelper", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(":memory:");
    db.exec(`
      CREATE TABLE metadata_test (
        id INTEGER PRIMARY KEY,
        owner_id INTEGER NOT NULL,
        parent_id INTEGER,
        name TEXT NOT NULL,
        value TEXT NOT NULL,
        type TEXT NOT NULL
      );
    `);
  });

  afterEach(() => {
    db.close();
  });

  it("persists recursive metadata tree", () => {
    const metadata = new Metadata(
      "Root",
      [
        new Metadata("Title", "Documento A", MetadataType.STRING),
        new Metadata(
          "Soggetto",
          [new Metadata("Nome", "Mario", MetadataType.STRING)],
          MetadataType.COMPOSITE,
        ),
      ],
      MetadataType.COMPOSITE,
    );

    saveMetadata(db, "metadata_test", "owner_id", 1, metadata);

    const rows = db
      .prepare(
        "SELECT owner_id, parent_id, name, value, type FROM metadata_test ORDER BY id",
      )
      .all() as Array<{
      owner_id: number;
      parent_id: number | null;
      name: string;
      value: string;
      type: string;
    }>;

    expect(rows).toHaveLength(4);
    expect(rows[0]).toEqual({
      owner_id: 1,
      parent_id: null,
      name: "Root",
      value: "",
      type: "COMPOSITE",
    });
    expect(rows[1].name).toBe("Title");
    expect(rows[2].name).toBe("Soggetto");
    expect(rows[3].name).toBe("Nome");
  });

  it("loads metadata rows ordered by id", () => {
    db.prepare(
      "INSERT INTO metadata_test (owner_id, parent_id, name, value, type) VALUES (?, ?, ?, ?, ?)",
    ).run(10, null, "A", "1", "STRING");
    db.prepare(
      "INSERT INTO metadata_test (owner_id, parent_id, name, value, type) VALUES (?, ?, ?, ?, ?)",
    ).run(10, null, "B", "2", "STRING");

    const loaded = loadMetadata(db, "metadata_test", "owner_id", 10);
    expect(loaded).toHaveLength(2);
    expect(loaded.map((r) => r.name)).toEqual(["A", "B"]);
  });

  it("accepts metadata arrays in saveMetadata", () => {
    const metadata = [
      new Metadata("X", "x", MetadataType.STRING),
      new Metadata("Y", "y", MetadataType.STRING),
    ];

    saveMetadata(db, "metadata_test", "owner_id", 2, metadata);

    const count = Number(
      (db.prepare("SELECT COUNT(*) as c FROM metadata_test WHERE owner_id = ?").get(2) as { c: number }).c,
    );
    expect(count).toBe(2);
  });
});
