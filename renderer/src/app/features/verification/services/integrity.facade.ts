import { Injectable, inject, signal, computed } from '@angular/core';
import { IntegrityIpcGateway } from '../infrastructure/integrity-ipc.gateway';
import { DocumentClassDTO, DocumentDTO, ProcessDTO } from '../../../shared/domain/dto/indexDTO';
import { IntegrityStatusEnum } from '../../../shared/domain/value-objects/IntegrityStatusEnum';
import { IntegrityNodeVM, IntegrityOverviewStats } from '../domain/integrity.view-models';

import { IIntegrityFacade } from '../contracts/IIntegrityFacade';
import { AppError } from '../../../shared/domain';
import {
  CACHE_SERVICE_TOKEN,
  ERROR_HANDLER_TOKEN,
  ICacheService,
  IErrorHandler,
} from '../../../shared/contracts';

@Injectable()
export class IntegrityFacade implements IIntegrityFacade {
  private readonly gateway = inject(IntegrityIpcGateway);
  private readonly errorHandler = inject<IErrorHandler>(ERROR_HANDLER_TOKEN);
  private readonly cacheService = inject<ICacheService>(CACHE_SERVICE_TOKEN);

  private readonly _isVerifying = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  private readonly _currentDipStatus = signal<IntegrityStatusEnum | null>(null);
  private readonly _dipClasses = signal<DocumentClassDTO[]>([]);

  public readonly isVerifying = computed(() => this._isVerifying());
  public readonly error = computed(() => this._error());
  public readonly currentDipStatus = computed(() => this._currentDipStatus());
  public readonly dipClasses = computed(() => this._dipClasses());

  private readonly _overviewStats = signal<IntegrityOverviewStats>({
    validProcesses: 0,
    invalidProcesses: 0,
    unverifiedProcesses: 0,
  });
  private readonly _corruptedNodes = signal<IntegrityNodeVM[]>([]);
  private readonly _validRolledUpNodes = signal<IntegrityNodeVM[]>([]);

  public readonly overviewStats = computed(() => this._overviewStats());
  public readonly corruptedNodes = computed(() => this._corruptedNodes());
  public readonly validRolledUpNodes = computed(() => this._validRolledUpNodes());

  private createEmptyOverviewStats(): IntegrityOverviewStats {
    return {
      validProcesses: 0,
      invalidProcesses: 0,
      unverifiedProcesses: 0,
    };
  }

  private updateProcessStats(stats: IntegrityOverviewStats, processes: ProcessDTO[]): void {
    for (const process of processes) {
      if (process.integrityStatus === IntegrityStatusEnum.VALID) {
        stats.validProcesses++;
      } else if (process.integrityStatus === IntegrityStatusEnum.INVALID) {
        stats.invalidProcesses++;
      } else {
        stats.unverifiedProcesses++;
      }
    }
  }

  private async collectClassOverview(
    cls: DocumentClassDTO,
    stats: IntegrityOverviewStats,
    valid: IntegrityNodeVM[],
    corrupted: IntegrityNodeVM[],
  ): Promise<void> {
    const processes = await this.gateway.getProcessesByClassId(cls.id);
    this.updateProcessStats(stats, processes);

    if (cls.integrityStatus === IntegrityStatusEnum.VALID) {
      valid.push({ id: cls.id, type: 'CLASS', name: cls.name, status: cls.integrityStatus });
      return;
    }

    await this.collectProcessOverview(cls, processes, valid, corrupted);
  }

  private async collectProcessOverview(
    cls: DocumentClassDTO,
    processes: ProcessDTO[],
    valid: IntegrityNodeVM[],
    corrupted: IntegrityNodeVM[],
  ): Promise<void> {
    for (const process of processes) {
      if (process.integrityStatus === IntegrityStatusEnum.VALID) {
        valid.push({
          id: process.id,
          type: 'PROCESS',
          name: `Processo ${process.uuid}`,
          status: process.integrityStatus,
          contextPath: cls.name,
        });
        continue;
      }

      const docs = await this.gateway.getDocumentsByProcessId(process.id);
      this.collectDocumentOverview(cls, process, docs, valid, corrupted);
    }
  }

  private collectDocumentOverview(
    cls: DocumentClassDTO,
    process: ProcessDTO,
    docs: DocumentDTO[],
    valid: IntegrityNodeVM[],
    corrupted: IntegrityNodeVM[],
  ): void {
    for (const doc of docs) {
      if (doc.integrityStatus === IntegrityStatusEnum.VALID) {
        valid.push({
          id: doc.id,
          type: 'DOCUMENT',
          name: `Doc ${doc.uuid}`,
          status: doc.integrityStatus,
          contextPath: `${cls.name} > ${process.uuid}`,
        });
        continue;
      }

      if (doc.integrityStatus === IntegrityStatusEnum.INVALID) {
        corrupted.push({
          id: doc.id,
          type: 'DOCUMENT',
          name: `Documento ${doc.uuid}`,
          status: doc.integrityStatus,
          contextPath: `Classe: ${cls.name} | Processo: ${process.uuid}`,
        });
      }
    }
  }

  /**
   * Carica la fotografia attuale del DIP navigando l'albero via IPC.
   */
  async loadOverview(dipId: number): Promise<void> {
    this._isVerifying.set(true);
    this._error.set(null);

    try {
      const classes = await this.gateway.getClassesByDipId(dipId);

      const stats = this.createEmptyOverviewStats();
      const corrupted: IntegrityNodeVM[] = [];
      const valid: IntegrityNodeVM[] = [];

      for (const cls of classes) {
        await this.collectClassOverview(cls, stats, valid, corrupted);
      }

      this._overviewStats.set(stats);
      this._validRolledUpNodes.set(valid);
      this._corruptedNodes.set(corrupted);
    } catch (rawError) {
      // 3. ARRICCHIMENTO DELL'ERRORE
      // Assicuriamoci che rawError sia un oggetto per potergli iniettare source e context
      // così che il tuo metodo handle() possa estrarli.
      const enrichedError =
        typeof rawError === 'object' && rawError !== null ? rawError : new Error(String(rawError));

      (enrichedError as any).source = 'IntegrityFacade.verifyDip';
      (enrichedError as any).context = { dipId, action: 'CHECK_DIP_INTEGRITY_STATUS' };

      // 4. GESTIONE CON IL TUO HANDLER
      const appError = this.errorHandler.handle(enrichedError);

      // 5. AGGIORNAMENTO UI
      this._error.set(appError.message);
    } finally {
      this._isVerifying.set(false);
    }
  }

  async verifyDip(dipId: number): Promise<void> {
    if (this._isVerifying()) return;

    this._isVerifying.set(true);
    this._error.set(null);

    try {
      // 1. Comando di verifica (Command)
      const status = await this.gateway.checkDipIntegrity(dipId);
      this.cacheService.invalidatePrefix('aggregate:');
      this.cacheService.invalidatePrefix('document:');
      this._currentDipStatus.set(status);

      // 2. Query per ricaricare l'albero UI
      const classes = await this.gateway.getClassesByDipId(dipId);
      this._dipClasses.set(classes);
    } catch (rawError: unknown) {
      // 3. ARRICCHIMENTO DELL'ERRORE
      // Assicuriamoci che rawError sia un oggetto per potergli iniettare source e context
      // così che il tuo metodo handle() possa estrarli.
      const enrichedError =
        typeof rawError === 'object' && rawError !== null ? rawError : new Error(String(rawError));

      (enrichedError as AppError).source = 'IntegrityFacade.verifyDip';
      (enrichedError as any).context = { dipId, action: 'CHECK_DIP_INTEGRITY_STATUS' };

      // 4. GESTIONE CON IL TUO HANDLER
      const appError = this.errorHandler.handle(enrichedError);

      // 5. AGGIORNAMENTO UI
      this._error.set(appError.message);
    } finally {
      this._isVerifying.set(false);
    }
  }

  async verifyItem(
    itemId: string,
    itemType: 'DOCUMENT' | 'AGGREGATE' | 'PROCESS' | 'DOCUMENT_CLASS',
  ): Promise<string> {
    if (this._isVerifying()) return 'UNKNOWN';

    this._isVerifying.set(true);
    this._error.set(null);

    let status = IntegrityStatusEnum.UNKNOWN;

    try {
      const idNum = Number(itemId);
      if (itemType === 'DOCUMENT') {
        status = await this.gateway.checkDocumentIntegrity(idNum);
      } else if (itemType === 'PROCESS' || itemType === 'AGGREGATE') {
        status = await this.gateway.checkProcessIntegrity(idNum);
      } else if (itemType === 'DOCUMENT_CLASS') {
        status = await this.gateway.checkDocumentClassIntegrity(idNum);
      }

      if (itemType === 'DOCUMENT') {
        this.cacheService.invalidate(`document:${itemId}`);
      } else if (itemType === 'PROCESS') {
        this.cacheService.invalidate(`process:${itemId}`);
        this.cacheService.invalidate(`aggregate:${itemId}`);
        this.cacheService.invalidatePrefix('document:');
      } else if (itemType === 'AGGREGATE') {
        this.cacheService.invalidate(`aggregate:${itemId}`);
        this.cacheService.invalidate(`process:${itemId}`);
        this.cacheService.invalidatePrefix('document:');
      } else if (itemType === 'DOCUMENT_CLASS') {
        this.cacheService.invalidate(`node-fallback:DOCUMENT_CLASS:${itemId}`);
        this.cacheService.invalidatePrefix('process:');
        this.cacheService.invalidatePrefix('aggregate:');
        this.cacheService.invalidatePrefix('document:');
      }

      return status;
    } catch (rawError: unknown) {
      const enrichedError =
        typeof rawError === 'object' && rawError !== null ? rawError : new Error(String(rawError));

      (enrichedError as AppError).source = 'IntegrityFacade.verifyItem';
      (enrichedError as any).context = { itemId, itemType, action: 'CHECK_ITEM_INTEGRITY' };

      const appError = this.errorHandler.handle(enrichedError);
      this._error.set(appError.message);
      return 'UNKNOWN';
    } finally {
      this._isVerifying.set(false);
    }
  }

  clearResults(): void {
    if (!this._isVerifying()) {
      this._currentDipStatus.set(null);
      this._dipClasses.set([]);
      this._error.set(null);
    }
  }
}
