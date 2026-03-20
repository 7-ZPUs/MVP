import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { ElectronLoggingGateway } from './electron-logging-gateway';
import { LogEntry, LogLevel } from '../domain';
import { IElectronContextBridge } from '../contracts';

describe('ElectronLoggingGateway', () => {
  let gateway: ElectronLoggingGateway;
  let mockBridge: IElectronContextBridge;

  const mockLogEntry: LogEntry = {
    level: LogLevel.INFO,
    event: 'TEST_EVENT',
    timestamp: 1620000000000,
    payload: { user: 'admin' },
  };

  beforeEach(() => {
    mockBridge = {
      invoke: vi.fn(),
    };

    gateway = new ElectronLoggingGateway(mockBridge);
  });

  it('dovrebbe chiamare il bridge IPC corretto e completarsi con successo', async () => {
    // Simuliamo una scrittura su file andata a buon fine
    (mockBridge.invoke as Mock).mockResolvedValue(undefined);

    await new Promise<void>((resolve) => {
      gateway.writeLog(mockLogEntry).subscribe({
        next: () => resolve(),
      });
    });

    // Verifichiamo che il canale corretto sia stato invocato con i dati esatti
    expect(mockBridge.invoke).toHaveBeenCalledWith('ipc:log:write', mockLogEntry);
  });

  it("dovrebbe propagare l'errore se la scrittura IPC fallisce", async () => {
    const mockError = new Error('Disco pieno');
    (mockBridge.invoke as Mock).mockRejectedValue(mockError);

    const errorResult = await new Promise((resolve) => {
      gateway.writeLog(mockLogEntry).subscribe({
        error: resolve,
      });
    });

    expect(errorResult).toBe(mockError);
    expect(mockBridge.invoke).toHaveBeenCalledTimes(1);
  });
});
