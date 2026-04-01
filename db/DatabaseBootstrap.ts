import Database from "better-sqlite3";
import { existsSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { inject } from "tsyringe";
import {
  INDEX_DIP_TOKEN,
  IIndexDip,
} from "../core/src/use-case/utils/indexing/IIndexDip";

export class ApplicationBootstrapAdapter {
  constructor(
    @inject(INDEX_DIP_TOKEN)
    private readonly indexDip: IIndexDip,
  ) {}

  async bootstrap(dipPath: string): Promise<void> {
    const appBasePath = this.getApplicationBasePath();
    this.bootstrapDatabase(appBasePath);

    const resolvedDipPath = path.resolve(dipPath);
    if (!existsSync(resolvedDipPath)) {
      throw new Error(`DIP directory not found: ${resolvedDipPath}`);
    }

    await this.indexDip.execute(resolvedDipPath);
  }

  bootstrapDatabase(appBasePath: string): void {
    const schemaPath = path.join(appBasePath, "db", "schema.sql");
    const dbPath = path.join(appBasePath, "dip-viewer.db");

    // Always rebuild DB from scratch before indexing.
    rmSync(dbPath, { force: true });

    const schema = readFileSync(schemaPath, "utf-8");
    const db = new Database(dbPath);
    db.exec(schema);
    db.close();
    console.log(`[BOOTSTRAP] Database bootstrapped successfully at ${dbPath}.`);
  }

  private getApplicationBasePath(): string {
    // App is expected to run from the folder that also contains dip.{uuid}
    return process.cwd();
  }
}
