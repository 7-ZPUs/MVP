export interface IElectronContextBridge {
  invoke<T>(channel: string, payload: unknown, signal?: AbortSignal): Promise<T>;
}
