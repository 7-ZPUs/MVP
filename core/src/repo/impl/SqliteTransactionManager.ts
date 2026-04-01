import { inject, injectable } from "tsyringe";
import {
  DATABASE_PROVIDER_TOKEN,
  DatabaseProvider,
} from "./DatabaseProvider";
import { ITransactionManager } from "../ITransactionManager";

@injectable()
export class SqliteTransactionManager implements ITransactionManager {
  constructor(
    @inject(DATABASE_PROVIDER_TOKEN)
    private readonly dbProvider: DatabaseProvider,
  ) {}

  async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
    const db = this.dbProvider.getDb();
    db.exec("BEGIN IMMEDIATE TRANSACTION");
    try {
      const result = await work();
      db.exec("COMMIT");
      return result;
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
}