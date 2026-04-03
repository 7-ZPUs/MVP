import { TestBed } from '@angular/core/testing';
import { DipIpcGateway } from './dip-ipc-gateway.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('DipIpcGateway', () => {
  let gateway: DipIpcGateway;
  
  // Mock del bridge Electron
  const mockElectron = {
    invoke: vi.fn()
  };

  beforeEach(() => {
   
    (globalThis as any).electron = mockElectron;
    
    TestBed.configureTestingModule({
      providers: [DipIpcGateway]
    });
    gateway = TestBed.inject(DipIpcGateway);
    vi.clearAllMocks();
  });

  it('getClasses dovrebbe invocare il canale corretto per caricare le classi', async () => {
    const mockDto = [{ id: '1', nome: 'Test' }];
    mockElectron.invoke.mockResolvedValue(mockDto);
    
    const result = await gateway.getClasses();

    expect(mockElectron.invoke).toHaveBeenCalledWith('browse:get-document-class-by-dip-id', 1);
    expect(result).toEqual(mockDto);
  });

  it('loadChildren dovrebbe convertire nodeId in numero e chiamare il canale browse', async () => {
    mockElectron.invoke.mockResolvedValue([]);
    
    await gateway.loadChildren('55');

    expect(mockElectron.invoke).toHaveBeenCalledWith('browse:get-documents-by-process', 55);
  });

  it('downloadFile dovrebbe chiamare il canale download con un path di destinazione', async () => {
    mockElectron.invoke.mockResolvedValue(new Blob());
    
    await gateway.downloadFile('10');

    expect(mockElectron.invoke).toHaveBeenCalledWith('file:download', 10, expect.any(String));
  });

  it('dovrebbe gestire l\'assenza di Electron (modalità browser) restituendo dati vuoti', async () => {

    (globalThis as any).electron = undefined;
    const webGateway = new DipIpcGateway();
    
    const result = await webGateway.getClasses();
    
    expect(result).toEqual([]);
    expect(mockElectron.invoke).not.toHaveBeenCalled();
  });
});