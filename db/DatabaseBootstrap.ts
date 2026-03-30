import Database from "better-sqlite3";
import { readFileSync } from "node:fs";

export function bootstrapDatabase(): void {
  // Initialize database connection and perform any necessary setup
  const schema = readFileSync("./schema.sql", "utf-8");
  const db = new Database("./dip-viewer.db");
  db.exec(schema);
  console.log("[BOOTSTRAP] Database bootstrapped successfully.");
}
