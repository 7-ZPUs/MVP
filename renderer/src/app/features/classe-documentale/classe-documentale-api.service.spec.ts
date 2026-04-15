import { TestBed } from '@angular/core/testing';
import { ClasseDocumentaleApiService } from './classe-documentale-api.service';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('ClasseDocumentaleApiService', () => {
  let service: ClasseDocumentaleApiService;
  let mockElectronAPI: any;

  beforeEach(() => {
    mockElectronAPI = {
      classeDocumentale: {
        list: vi.fn(),
        get: vi.fn(),
        create: vi.fn(),
      },
    };

    (window as any).electronAPI = mockElectronAPI;

    TestBed.configureTestingModule({});
    service = TestBed.inject(ClasseDocumentaleApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('findAll', () => {
    it('should call electronAPI.classeDocumentale.list and return the result', async () => {
      const mockClasses = [{ id: 1, nome: 'Classe 1' }];
      mockElectronAPI.classeDocumentale.list.mockResolvedValue(mockClasses);

      const result = await service.findAll();

      expect(mockElectronAPI.classeDocumentale.list).toHaveBeenCalled();
      expect(result).toEqual(mockClasses);
    });
  });

  describe('findById', () => {
    it('should call electronAPI.classeDocumentale.get with correct id and return the result', async () => {
      const mockClasse = { id: 1, nome: 'Classe 1' };
      mockElectronAPI.classeDocumentale.get.mockResolvedValue(mockClasse);

      const result = await service.findById(1);

      expect(mockElectronAPI.classeDocumentale.get).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockClasse);
    });
  });

  describe('create', () => {
    it('should call electronAPI.classeDocumentale.create with correct name and return the result', async () => {
      const mockClasse = { id: 1, nome: 'Nuova Classe' };
      mockElectronAPI.classeDocumentale.create.mockResolvedValue(mockClasse);

      const result = await service.create('Nuova Classe');

      expect(mockElectronAPI.classeDocumentale.create).toHaveBeenCalledWith('Nuova Classe');
      expect(result).toEqual(mockClasse);
    });
  });
});
