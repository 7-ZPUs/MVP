import { TestBed } from '@angular/core/testing';
import { ExportIpcGateway } from './export-ipc-gateway.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ExportIpcGateway', () => {
  let gateway: ExportIpcGateway;
  
  
  const mockElectron = {
    invoke: vi.fn()
  };

  beforeEach(() => {
  
    (globalThis as any).electron = mockElectron;
    
    TestBed.configureTestingModule({
      providers: [ExportIpcGateway]
    });
    gateway = TestBed.inject(ExportIpcGateway);
    vi.clearAllMocks();
  });

  it('exportDocument dovrebbe convertire nodeId in numero e invocare il canale corretto', async () => {
    mockElectron.invoke.mockResolvedValue({ success: true });
    
    const result = await gateway.exportDocument('123', 'C:/dest');

    expect(mockElectron.invoke).toHaveBeenCalledWith('file:download', 123, 'C:/dest');
    expect(result.success).toBe(true);
  });

  it('exportDocuments (multiplo) dovrebbe chiamare il download per ogni ID in sequenza', async () => {
    mockElectron.invoke.mockResolvedValue({ success: true });
    const ids = ['1', '2'];
    
    await gateway.exportDocuments(ids, 'C:/dest');

    expect(mockElectron.invoke).toHaveBeenCalledTimes(2);
    expect(mockElectron.invoke).toHaveBeenNthCalledWith(1, 'file:download', 1, 'C:/dest');
    expect(mockElectron.invoke).toHaveBeenNthCalledWith(2, 'file:download', 2, 'C:/dest');
  });

  it('printDocument dovrebbe chiamare il canale di stampa', async () => {
    mockElectron.invoke.mockResolvedValue({ success: true });
    
    await gateway.printDocument('99');

    expect(mockElectron.invoke).toHaveBeenCalledWith('file:print', 99);
  });

  it('openSaveDialog dovrebbe usare il fallback se il canale fallisce o non esiste', async () => {
   
    mockElectron.invoke.mockRejectedValue(new Error('Channel not found'));
    
    const result = await gateway.openSaveDialog('test.pdf');

    expect(result.canceled).toBe(false);
    expect(result.filePath).toBe('C:/Spostami/test-file.pdf');
  });

  it('dovrebbe gestire l\'assenza del bridge Electron senza crashare', async () => {
    (globalThis as any).electron = undefined;
    const webGateway = new ExportIpcGateway();
    
    const result = await webGateway.exportDocument('1', 'path');
    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe('Bridge non disponibile');
  });
});