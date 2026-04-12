export const TRANSACTION_MANAGER_TOKEN = Symbol("ITransactionManager");

export interface ITransactionManager {
  runInTransaction<T>(work: () => Promise<T>): Promise<T>;
}