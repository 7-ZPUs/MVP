import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { ElectronLoggingGateway } from './electron-logging-gateway';
import { LogEntry, LogLevel } from '../../shared/domain';
import { ELECTRON_CONTEXT_BRIDGE_TOKEN, IElectronContextBridge } from '../contracts/index';
import { TestBed } from '@angular/core/testing';

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

    TestBed.configureTestingModule({
      providers: [
        ElectronLoggingGateway,
        { provide: ELECTRON_CONTEXT_BRIDGE_TOKEN, useValue: mockBridge },
      ],
    });

    gateway = TestBed.inject(ElectronLoggingGateway);
  });

  it('dovrebbe chiamare il bridge IPC corretto e completarsi con successo', async () => {
    (mockBridge.invoke as Mock).mockResolvedValue(undefined);

    await new Promise<void>((resolve) => {
      gateway.writeLog(mockLogEntry).subscribe({
        next: () => resolve(),
      });
    });

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
