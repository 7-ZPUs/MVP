import { ExportIpcGateway } from './export-ipc-gateway.service';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ExportIpcGateway', () => {
  let gateway: ExportIpcGateway;

  const mockElectron = { invoke: vi.fn() };

  beforeEach(() => {
    (globalThis as any).electron = mockElectron;
    gateway = new ExportIpcGateway();
    vi.clearAllMocks();
  });

  afterEach(() => {
    (globalThis as any).electron = mockElectron;
  });

  it('exportFile dovrebbe invocare il canale corretto con fileId numerico e destPath', async () => {
    mockElectron.invoke.mockResolvedValue({ success: true });
    const result = await gateway.exportFile(123, 'C:/dest');
    expect(mockElectron.invoke).toHaveBeenCalledWith('file:download', 123, 'C:/dest');
    expect(result.success).toBe(true);
  });

  it('openSaveDialog dovrebbe invocare il canale corretto con il nome di default', async () => {
    mockElectron.invoke.mockResolvedValue({ canceled: false, filePath: 'C:/dest/test.pdf' });
    const result = await gateway.openSaveDialog('test.pdf');
    expect(mockElectron.invoke).toHaveBeenCalledWith('file:save-dialog', 'test.pdf');
    expect(result.canceled).toBe(false);
    expect(result.filePath).toBe('C:/dest/test.pdf');
  });

  it('openSaveDialog senza argomenti dovrebbe funzionare', async () => {
    mockElectron.invoke.mockResolvedValue({ canceled: true });
    const result = await gateway.openSaveDialog();
    expect(mockElectron.invoke).toHaveBeenCalledWith('file:save-dialog', undefined);
    expect(result.canceled).toBe(true);
  });

  it('dovrebbe gestire l\'assenza del bridge Electron in exportFile', async () => {
    (globalThis as any).electron = undefined;
    const webGateway = new ExportIpcGateway();
    const result = await webGateway.exportFile(1, 'path');
    expect(result.success).toBe(false);
  });

  it('dovrebbe gestire l\'assenza del bridge Electron in openSaveDialog', async () => {
    (globalThis as any).electron = undefined;
    const webGateway = new ExportIpcGateway();
    const result = await webGateway.openSaveDialog('test.pdf');
    expect(result.canceled).toBe(true);
  });
});