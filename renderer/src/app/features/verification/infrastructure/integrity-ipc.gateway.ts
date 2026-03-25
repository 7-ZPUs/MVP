import { Injectable } from '@angular/core';
import { IIntegrityIpcGateway } from '../contracts/IIntegrityIpcGateway';
import { IntegrityStatusEnum } from '../../../shared/domain/value-objects/IntegrityStatusEnum';
import { IpcChannels } from '../../../../../../shared/ipc-channels';
import {
  DocumentClassDTO,
  ProcessDTO,
  DocumentDTO,
  FileDTO,
} from '../../../shared/domain/dto/indexDTO';

// ============================================================================
// DATABASE MOCK PER TESTARE TUTTI GLI SCENARI UI
// ============================================================================
const NOW = new Date().toISOString();

const MOCK_CLASSES: DocumentClassDTO[] = [
  {
    id: 10,
    dipId: 1,
    uuid: 'cls-10-valid',
    name: 'Fascicoli Personale',
    timestamp: NOW,
    integrityStatus: IntegrityStatusEnum.VALID,
  },
  {
    id: 20,
    dipId: 1,
    uuid: 'cls-20-mixed',
    name: 'Delibere',
    timestamp: NOW,
    integrityStatus: IntegrityStatusEnum.INVALID,
  },
  {
    id: 30,
    dipId: 1,
    uuid: 'cls-30-unver',
    name: 'Fatture Elettroniche',
    timestamp: NOW,
    integrityStatus: IntegrityStatusEnum.UNKNOWN,
  },
  {
    id: 40,
    dipId: 1,
    uuid: 'cls-40-corrupt',
    name: 'Archivio Storico',
    timestamp: NOW,
    integrityStatus: IntegrityStatusEnum.INVALID,
  },
];

const MOCK_PROCESSES: ProcessDTO[] = [
  // Processi della Classe 10 (Tutti Validi)
  {
    id: 101,
    documentClassId: 10,
    uuid: 'proc-101-assunzione',
    integrityStatus: IntegrityStatusEnum.VALID,
    metadata: [],
  },
  {
    id: 102,
    documentClassId: 10,
    uuid: 'proc-102-dimissioni',
    integrityStatus: IntegrityStatusEnum.VALID,
    metadata: [],
  },

  // Processi della Classe 20 (Uno valido, uno invalido)
  {
    id: 201,
    documentClassId: 20,
    uuid: 'proc-201-delibera-ok',
    integrityStatus: IntegrityStatusEnum.VALID,
    metadata: [],
  },
  {
    id: 202,
    documentClassId: 20,
    uuid: 'proc-202-delibera-ko',
    integrityStatus: IntegrityStatusEnum.INVALID,
    metadata: [],
  },

  // Processi della Classe 30 (Sconosciuti)
  {
    id: 301,
    documentClassId: 30,
    uuid: 'proc-301-fattura-gen',
    integrityStatus: IntegrityStatusEnum.UNKNOWN,
    metadata: [],
  },

  // Processi della Classe 40 (Tutti Invalidi)
  {
    id: 401,
    documentClassId: 40,
    uuid: 'proc-401-storico-1',
    integrityStatus: IntegrityStatusEnum.INVALID,
    metadata: [],
  },
  {
    id: 402,
    documentClassId: 40,
    uuid: 'proc-402-storico-2',
    integrityStatus: IntegrityStatusEnum.INVALID,
    metadata: [],
  },
];

const MOCK_DOCUMENTS: DocumentDTO[] = [
  // Documenti Processo 202 (Misto)
  {
    id: 2021,
    processId: 202,
    uuid: 'doc-2021-testo-valido',
    integrityStatus: IntegrityStatusEnum.VALID,
    metadata: [],
  },
  {
    id: 2022,
    processId: 202,
    uuid: 'doc-2022-allegato-falso',
    integrityStatus: IntegrityStatusEnum.INVALID,
    metadata: [],
  },

  // Documenti Processo 301
  {
    id: 3011,
    processId: 301,
    uuid: 'doc-3011-xml',
    integrityStatus: IntegrityStatusEnum.UNKNOWN,
    metadata: [],
  },

  // Documenti Processi 401 e 402
  {
    id: 4011,
    processId: 401,
    uuid: 'doc-4011-scan1',
    integrityStatus: IntegrityStatusEnum.INVALID,
    metadata: [],
  },
  {
    id: 4012,
    processId: 401,
    uuid: 'doc-4012-scan2',
    integrityStatus: IntegrityStatusEnum.INVALID,
    metadata: [],
  },
  {
    id: 4021,
    processId: 402,
    uuid: 'doc-4021-foto',
    integrityStatus: IntegrityStatusEnum.INVALID,
    metadata: [],
  },
];

const MOCK_FILES: FileDTO[] = [
  // File del documento corrotto 2022
  {
    id: 20221,
    documentId: 2022,
    filename: 'allegato_modificato.pdf',
    path: '/mock/path',
    hash: 'badhash',
    integrityStatus: IntegrityStatusEnum.INVALID,
    isMain: true,
  },

  // File dei documenti corrotti 40x
  {
    id: 40111,
    documentId: 4011,
    filename: 'scansione_1_corrotta.tiff',
    path: '/mock/path',
    hash: 'badhash',
    integrityStatus: IntegrityStatusEnum.INVALID,
    isMain: true,
  },
  {
    id: 40121,
    documentId: 4012,
    filename: 'scansione_2_corrotta.tiff',
    path: '/mock/path',
    hash: 'badhash',
    integrityStatus: IntegrityStatusEnum.INVALID,
    isMain: true,
  },
  {
    id: 40211,
    documentId: 4021,
    filename: 'foto_alterata.jpg',
    path: '/mock/path',
    hash: 'badhash',
    integrityStatus: IntegrityStatusEnum.INVALID,
    isMain: true,
  },
];

// ============================================================================
// CLASSE GATEWAY
// ============================================================================

@Injectable({ providedIn: 'root' })
export class IntegrityIpcGateway implements IIntegrityIpcGateway {
  private async invokeOrMock<T>(channel: string, mockFactory: () => T, ...args: any[]): Promise<T> {
    const electronApi = (window as any).api;
    if (electronApi && typeof electronApi.invoke === 'function') {
      return electronApi.invoke(channel, ...args);
    }

    // Riduciamo il tempo di mock a 300ms per non annoiare durante i test
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockFactory()), 300);
    });
  }

  // --- COMMANDS (Per ora simuliamo che la verifica restituisca VALID per finta) ---
  async checkDipIntegrity(dipId: number): Promise<IntegrityStatusEnum> {
    return this.invokeOrMock(
      IpcChannels.CHECK_DIP_INTEGRITY_STATUS,
      () => IntegrityStatusEnum.INVALID,
      dipId,
    );
  }
  async checkDocumentClassIntegrity(classId: number): Promise<IntegrityStatusEnum> {
    return this.invokeOrMock(
      IpcChannels.CHECK_DOCUMENT_CLASS_INTEGRITY_STATUS,
      () => IntegrityStatusEnum.INVALID,
      classId,
    );
  }
  async checkProcessIntegrity(processId: number): Promise<IntegrityStatusEnum> {
    return this.invokeOrMock(
      IpcChannels.CHECK_PROCESS_INTEGRITY_STATUS,
      () => IntegrityStatusEnum.INVALID,
      processId,
    );
  }
  async checkDocumentIntegrity(documentId: number): Promise<IntegrityStatusEnum> {
    return this.invokeOrMock(
      IpcChannels.CHECK_DOCUMENT_INTEGRITY_STATUS,
      () => IntegrityStatusEnum.INVALID,
      documentId,
    );
  }
  async checkFileIntegrity(fileId: number): Promise<IntegrityStatusEnum> {
    return this.invokeOrMock(
      IpcChannels.CHECK_FILE_INTEGRITY_STATUS,
      () => IntegrityStatusEnum.INVALID,
      fileId,
    );
  }

  // --- QUERIES (Restituiscono i dati filtrati dal database mock in alto) ---

  async getClassesByDipId(dipId: number): Promise<DocumentClassDTO[]> {
    return this.invokeOrMock(
      IpcChannels.BROWSE_GET_DOCUMENT_CLASS_BY_DIP_ID,
      () => MOCK_CLASSES.filter((c) => c.dipId === dipId),
      dipId,
    );
  }

  async getProcessesByClassId(classId: number): Promise<ProcessDTO[]> {
    return this.invokeOrMock(
      IpcChannels.BROWSE_GET_PROCESS_BY_DOCUMENT_CLASS,
      () => MOCK_PROCESSES.filter((p) => p.documentClassId === classId),
      classId,
    );
  }

  async getDocumentsByProcessId(processId: number): Promise<DocumentDTO[]> {
    return this.invokeOrMock(
      IpcChannels.BROWSE_GET_DOCUMENTS_BY_PROCESS,
      () => MOCK_DOCUMENTS.filter((d) => d.processId === processId),
      processId,
    );
  }

  async getFilesByDocumentId(documentId: number): Promise<FileDTO[]> {
    return this.invokeOrMock(
      IpcChannels.BROWSE_GET_FILE_BY_DOCUMENT,
      () => MOCK_FILES.filter((f) => f.documentId === documentId),
      documentId,
    );
  }
}
