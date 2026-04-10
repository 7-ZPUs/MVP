import Database from "better-sqlite3";
import path from "node:path";
import { VectorDAO } from "../../src/dao/VectorDAO";
import { Vector } from "../../src/entity/Vector";

let db: Database.Database;
const runSqliteVssTests = process.env.RUN_SQLITE_VSS_TESTS === "true";

function sqliteVssPackageName(
  platformName: NodeJS.Platform,
  archName: string,
): string {
  const osName = platformName === "win32" ? "windows" : platformName;
  return `sqlite-vss-${osName}-${archName}`;
}

function loadSqliteVssExtensions(database: Database.Database): void {
  const packageName = sqliteVssPackageName(process.platform, process.arch);
  const packageJsonPath = require.resolve(`${packageName}/package.json`);
  const packageDir = path.dirname(packageJsonPath);
  const vectorPath = path.join(packageDir, "lib", "vector0");
  const vssPath = path.join(packageDir, "lib", "vss0");

  database.loadExtension(vectorPath);
  database.loadExtension(vssPath);
}

describe("VectorDAO", () => {
  beforeEach(() => {
    db = new Database(":memory:");
    db.prepare(
      `CREATE TABLE document_vector (
                    document_id INTEGER PRIMARY KEY,
                    embedding BLOB NOT NULL
            )`,
    ).run();
    db.prepare(
      `CREATE TABLE document_vector_vss (
                    rowid INTEGER PRIMARY KEY,
                    embedding BLOB NOT NULL
            )`,
    ).run();
  });

  afterEach(() => {
    db.close();
  });

  it("should save and retrieve a vector correctly", () => {
    const dao = new VectorDAO(db);
    const vector = new Vector(1, new Float32Array([0.1, 0.2, 0.3]));

    dao.save(vector);
    const retrievedVector = dao.getByDocumentId(1);

    expect(retrievedVector).not.toBeNull();
    expect(retrievedVector?.getDocumentId()).toBe(1);
    expect(retrievedVector?.getEmbedding()).toEqual(
      new Float32Array([0.1, 0.2, 0.3]),
    );
  });

  it("should return null for non-existent document ID", () => {
    const dao = new VectorDAO(db);
    const result = dao.getByDocumentId(999);
    expect(result).toBeNull();
  });

  it("should return empty array when searching similar vectors with topK <= 0", () => {
    const dao = new VectorDAO(db);
    const result = dao.searchSimilar(new Float32Array([0.1, 0.2, 0.3]), 0);
    expect(result).toEqual([]);
  });

  (runSqliteVssTests ? it : it.skip)(
    "should return nearest vectors using sqlite-vss",
    () => {
      const dao = new VectorDAO(db);
      loadSqliteVssExtensions(db);
      db.prepare("DROP TABLE document_vector_vss").run();
      db.prepare(
        "CREATE VIRTUAL TABLE document_vector_vss USING vss0(embedding(3))",
      ).run();

      dao.save(new Vector(1, new Float32Array([0.1, 0.2, 0.3])));
      dao.save(new Vector(2, new Float32Array([0.1, 0.2, 0.4])));
      dao.save(new Vector(3, new Float32Array([0.9, 0.8, 0.7])));

      const queryVector = new Float32Array([0.1, 0.2, 0.3]);
      const results = dao.searchSimilar(queryVector, 2);

      expect(results).toHaveLength(2);
      expect(results[0].documentId).toBe(1);
      expect(results[1].documentId).toBe(2);
      expect(results[0].score).toBeGreaterThan(results[1].score);
    },
  );
});
