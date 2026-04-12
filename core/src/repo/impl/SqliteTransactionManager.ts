import { inject, injectable } from "tsyringe";
import { ITransactionManager } from "../ITransactionManager";
import Database from "better-sqlite3";
import { SQLITE_DB_TOKEN } from "../../../../db/DatabaseBootstrap";

@injectable()
export class SqliteTransactionManager implements ITransactionManager {
  constructor(
    @inject(SQLITE_DB_TOKEN)
    private readonly db: Database.Database,
  ) {}

  async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    this.db.exec("BEGIN IMMEDIATE TRANSACTION");
    try {
      const result = await work();
      this.db.exec("COMMIT");
      return result;
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }
}
