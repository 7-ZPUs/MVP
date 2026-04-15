import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { IntegrityIpcGateway } from './integrity-ipc.gateway';
import { IpcChannels } from '../../../../../../shared/ipc-channels';
import { IntegrityStatusEnum } from '../../../shared/domain/value-objects/IntegrityStatusEnum';

describe('IntegrityIpcGateway', () => {
  let gateway: IntegrityIpcGateway;
  let mockInvoke: any;

  beforeEach(() => {
    mockInvoke = vi.fn();

    // Mockiamo (window as any).electronAPI
    (window as any).electronAPI = {
      invoke: mockInvoke,
    };

    TestBed.configureTestingModule({
      providers: [IntegrityIpcGateway],
    });

    gateway = TestBed.inject(IntegrityIpcGateway);
  });

  afterEach(() => {
    delete (window as any).electronAPI;
    delete (window as any).api;
    vi.restoreAllMocks();
  });

  it('dovrebbe istanziare il servizio', () => {
    expect(gateway).toBeTruthy();
  });

  it('dovrebbe lanciare un errore se la Electron API non è disponibile', async () => {
    delete (window as any).electronAPI;
    delete (window as any).api;

    await expect(gateway.checkDipIntegrity(1)).rejects.toThrow(
      `Electron API not available for channel ${IpcChannels.CHECK_DIP_INTEGRITY_STATUS}`,
    );
  });

  it('dovrebbe usare (window as any).api come fallback se electronAPI non cè', async () => {
    delete (window as any).electronAPI;
    (window as any).api = { invoke: mockInvoke };
    mockInvoke.mockResolvedValue(IntegrityStatusEnum.VALID);

    const result = await gateway.checkDipIntegrity(1);
    expect(mockInvoke).toHaveBeenCalledWith(IpcChannels.CHECK_DIP_INTEGRITY_STATUS, 1);
    expect(result).toBe(IntegrityStatusEnum.VALID);
  });

  describe('Command IPC Calls', () => {
    it('checkDipIntegrity', async () => {
      mockInvoke.mockResolvedValue(IntegrityStatusEnum.VALID);
      const res = await gateway.checkDipIntegrity(10);
      expect(mockInvoke).toHaveBeenCalledWith(IpcChannels.CHECK_DIP_INTEGRITY_STATUS, 10);
      expect(res).toBe(IntegrityStatusEnum.VALID);
    });

    it('checkDocumentClassIntegrity', async () => {
      mockInvoke.mockResolvedValue(IntegrityStatusEnum.INVALID);
      const res = await gateway.checkDocumentClassIntegrity(11);
      expect(mockInvoke).toHaveBeenCalledWith(
        IpcChannels.CHECK_DOCUMENT_CLASS_INTEGRITY_STATUS,
        11,
      );
      expect(res).toBe(IntegrityStatusEnum.INVALID);
    });

    it('checkProcessIntegrity', async () => {
      mockInvoke.mockResolvedValue(IntegrityStatusEnum.UNKNOWN);
      const res = await gateway.checkProcessIntegrity(12);
      expect(mockInvoke).toHaveBeenCalledWith(IpcChannels.CHECK_PROCESS_INTEGRITY_STATUS, 12);
      expect(res).toBe(IntegrityStatusEnum.UNKNOWN);
    });

    it('checkDocumentIntegrity', async () => {
      mockInvoke.mockResolvedValue(IntegrityStatusEnum.VALID);
      const res = await gateway.checkDocumentIntegrity(13);
      expect(mockInvoke).toHaveBeenCalledWith(IpcChannels.CHECK_DOCUMENT_INTEGRITY_STATUS, 13);
      expect(res).toBe(IntegrityStatusEnum.VALID);
    });

    it('checkFileIntegrity', async () => {
      mockInvoke.mockResolvedValue(IntegrityStatusEnum.INVALID);
      const res = await gateway.checkFileIntegrity(14);
      expect(mockInvoke).toHaveBeenCalledWith(IpcChannels.CHECK_FILE_INTEGRITY_STATUS, 14);
      expect(res).toBe(IntegrityStatusEnum.INVALID);
    });
  });

  describe('Query IPC Calls', () => {
    it('getClassesByDipId', async () => {
      const mockResult = [{ id: 1, name: 'Classe A' }];
      mockInvoke.mockResolvedValue(mockResult);

      const res = await gateway.getClassesByDipId(20);

      expect(mockInvoke).toHaveBeenCalledWith(IpcChannels.BROWSE_GET_DOCUMENT_CLASS_BY_DIP_ID, 20);
      expect(res).toEqual(mockResult);
    });

    it('getProcessesByClassId', async () => {
      const mockResult = [{ id: 2, uuid: 'P-123' }];
      mockInvoke.mockResolvedValue(mockResult);

      const res = await gateway.getProcessesByClassId(21);

      expect(mockInvoke).toHaveBeenCalledWith(IpcChannels.BROWSE_GET_PROCESS_BY_DOCUMENT_CLASS, 21);
      expect(res).toEqual(mockResult);
    });

    it('getDocumentsByProcessId', async () => {
      const mockResult = [{ id: 3, uuid: 'D-123' }];
      mockInvoke.mockResolvedValue(mockResult);

      const res = await gateway.getDocumentsByProcessId(22);

      expect(mockInvoke).toHaveBeenCalledWith(IpcChannels.BROWSE_GET_DOCUMENTS_BY_PROCESS, 22);
      expect(res).toEqual(mockResult);
    });

    it('getFilesByDocumentId', async () => {
      const mockResult = [{ id: 4, filename: 'doc.pdf' }];
      mockInvoke.mockResolvedValue(mockResult);

      const res = await gateway.getFilesByDocumentId(23);

      expect(mockInvoke).toHaveBeenCalledWith(IpcChannels.BROWSE_GET_FILE_BY_DOCUMENT, 23);
      expect(res).toEqual(mockResult);
    });
  });
});
