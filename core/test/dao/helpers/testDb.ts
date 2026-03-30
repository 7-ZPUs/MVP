import fs from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

let cachedSchema: string | null = null;

function readSchema(): string {
  if (cachedSchema) {
    return cachedSchema;
  }

  const schemaPath = path.resolve(process.cwd(), "db/schema.sql");
  cachedSchema = fs.readFileSync(schemaPath, "utf8");
  return cachedSchema;
}

export function createTestDb(): Database.Database {
  const db = new Database(":memory:");
  db.pragma("foreign_keys = ON");
  db.exec(readSchema());
  return db;
}

export function seedHierarchy(db: Database.Database): {
  dipId: number;
  dipUuid: string;
  documentClassId: number;
  documentClassUuid: string;
  processId: number;
  processUuid: string;
  documentId: number;
  documentUuid: string;
} {
  const dipUuid = "dip-seed-uuid";
  const documentClassUuid = "dc-seed-uuid";
  const processUuid = "proc-seed-uuid";
  const documentUuid = "doc-seed-uuid";

  const dipId = Number(
    db.prepare("INSERT INTO dip (uuid, integrity_status) VALUES (?, ?)").run(
      dipUuid,
      "UNKNOWN",
    ).lastInsertRowid,
  );

  const documentClassId = Number(
    db.prepare(
      "INSERT INTO document_class (dip_id, uuid, integrity_status, name, timestamp) VALUES (?, ?, ?, ?, ?)",
    )
      .run(
        dipId,
        documentClassUuid,
        "UNKNOWN",
        "Classe Seed",
        "2026-01-01T00:00:00Z",
      )
      .lastInsertRowid,
  );

  const processId = Number(
    db.prepare(
      "INSERT INTO process (document_class_id, uuid, integrity_status) VALUES (?, ?, ?)",
    )
      .run(documentClassId, processUuid, "UNKNOWN")
      .lastInsertRowid,
  );

  const documentId = Number(
    db.prepare(
      "INSERT INTO document (uuid, integrity_status, process_id) VALUES (?, ?, ?)",
    )
      .run(documentUuid, "UNKNOWN", processId)
      .lastInsertRowid,
  );

  return {
    dipId,
    dipUuid,
    documentClassId,
    documentClassUuid,
    processId,
    processUuid,
    documentId,
    documentUuid,
  };
}
