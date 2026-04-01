import { Injectable, Signal } from '@angular/core';
import { AppError, ErrorCode, ErrorCategory } from '../../../shared/domain/app-error';

import { IDipFacade }             from '../contracts/i-dip-facade';
import { DipIpcGateway }          from '../infrastructure/dip-ipc-gateway.service';
import { ImportState }            from '../domain/import.state';
import { DipTreeNode }            from '../domain/models';
import { DipMapper }              from '../domain/mappers';
import { ImportPhase }            from '../domain/enums';
 
@Injectable({ providedIn: 'root' })
export class ImportFacade implements IDipFacade {
 
  constructor(
    private readonly importState:    ImportState,
    private readonly ipcGateway:     DipIpcGateway,
    // private readonly errorHandler:   GlobalErrorHandlerService,
    // private readonly auditLogger:    AuditLogger,
    // private readonly perfMonitor:    PerformanceMonitor,
    // private readonly liveAnnouncer:  LiveAnnouncerService,
  ) {}
 
  // ------------------------------------------------------------------
  // Segnali esposti ai componenti (lettura)
  // ------------------------------------------------------------------
  get rootNodes():        Signal<DipTreeNode[]>      { return this.importState.rootNodes; }
  get selectedDocument(): Signal<DipTreeNode | null> { return this.importState.selectedDocument; }
  get loading():          Signal<boolean>            { return this.importState.loading; }
  get phase():            Signal<ImportPhase>        { return this.importState.phase; }
 
  // ------------------------------------------------------------------
  // UC-1: carica classi documentali radice
  // ------------------------------------------------------------------
  async loadRootNodes(): Promise<void> {
    this.importState.setLoading(true);
 
    // Commentato perfMonitor perché l'import è disattivato
    // await this.perfMonitor.measure('loadRootNodes', async () => {
      try {
        const dtos  = await this.ipcGateway.getClasses();
        const nodes = dtos.map(DipMapper.classeToDipTreeNode);
 
        this.importState.setRootNodes(nodes);
 
        /* Commentato AuditLogger
        this.auditLogger.log({
          action:    'loadRootNodes',
          context:   'ImportFacade',
          timestamp: new Date(),
          payload:   { count: nodes.length },
        });
        */

        /* Commentato LiveAnnouncer
        this.liveAnnouncer.announce(
          `DIP caricato: ${nodes.length} classi documentali`,
        );
        */
      } catch (err) {
        const appError = new AppError(
          ErrorCode.LOAD_ROOT_FAILED,
          ErrorCategory.IPC,
          'ImportFacade.loadRootNodes',
          (err as Error).message ?? 'Errore caricamento DIP',
          true,
        );
        this.importState.setError(appError);
        
        /* Commentato AuditLogger nell'errore
        this.auditLogger.log({
          action:    'loadRootNodes:error',
          context:   'ImportFacade',
          timestamp: new Date(),
          payload:   { error: appError.message },
        });
        */
      }
    // }); // fine perfMonitor
  }
 
  // ------------------------------------------------------------------
  // UC-2/UC-3: lazy loading figli di un nodo
  // ------------------------------------------------------------------
  async loadChildren(nodeId: string): Promise<void> {
    const cached = this.importState.nodeCache().get(nodeId);
    if (cached) return;
 
    try {
      const dtos     = await this.ipcGateway.loadChildren(nodeId);
      const children = dtos.map(DipMapper.toDipTreeNode);
 
      this.importState.setChildrenForNode(nodeId, children);
 
      /* Commentato AuditLogger
      this.auditLogger.log({
        action:    'loadChildren',
        context:   'ImportFacade',
        timestamp: new Date(),
        payload:   { nodeId, count: children.length },
      });
      */
    } catch (err) {
      const appError = new AppError(
        ErrorCode.LOAD_CHILDREN_FAILED,
        ErrorCategory.IPC,
        `ImportFacade.loadChildren(${nodeId})`,
        (err as Error).message ?? 'Errore caricamento figli',
        true,
      );
      this.importState.setChildrenError(nodeId, appError);
    }
  }
 
  // ------------------------------------------------------------------
  // Selezione documento corrente
  // ------------------------------------------------------------------
  selectDocument(node: DipTreeNode): void {
    this.importState.setSelectedDocument(node);
    
    /* Commentato AuditLogger
    this.auditLogger.log({
      action:    'selectDocument',
      context:   'ImportFacade',
      timestamp: new Date(),
      payload:   { nodeId: node.id, label: node.label },
    });
    */
  }
 
  // ------------------------------------------------------------------
  // UC-36: retry dopo errore
  // ------------------------------------------------------------------
  retryLoad(): void {
    this.importState.reset();
    this.loadRootNodes();
  }
 
  clearCache(): void {
    this.importState.reset();
  }
}