import { Injectable, Signal, inject } from '@angular/core';
import { ErrorCode, ErrorCategory, ErrorSeverity } from '../../../shared/domain/error.enum';
import type { AppError } from '../../../shared/domain';

import { IDipFacade } from '../contracts/i-dip-facade';
import { DipIpcGateway } from '../infrastructure/dip-ipc-gateway.service';
import { ImportState } from '../domain/import.state';
import { DipTreeNode } from '../domain/models';
import { DipMapper } from '../domain/mappers';
import { ImportPhase } from '../domain/enums';

@Injectable({ providedIn: 'root' })
export class ImportFacade implements IDipFacade {
  private readonly importState = inject(ImportState);
  private readonly ipcGateway = inject(DipIpcGateway);
  // private readonly errorHandler = inject(GlobalErrorHandlerService);
  // private readonly auditLogger = inject(AuditLogger);
  // private readonly perfMonitor = inject(PerformanceMonitor);
  // private readonly liveAnnouncer = inject(LiveAnnouncerService);

  // ------------------------------------------------------------------
  // Segnali esposti ai componenti (lettura)
  // ------------------------------------------------------------------
  get rootNodes(): Signal<DipTreeNode[]> {
    return this.importState.rootNodes;
  }
  get selectedDocument(): Signal<DipTreeNode | null> {
    return this.importState.selectedDocument;
  }
  get loading(): Signal<boolean> {
    return this.importState.loading;
  }
  get phase(): Signal<ImportPhase> {
    return this.importState.phase;
  }

  // ------------------------------------------------------------------
  // UC-1: carica classi documentali radice
  // ------------------------------------------------------------------
  async loadRootNodes(): Promise<void> {
    this.importState.setLoading(true);

    // Commentato perfMonitor perché l'import è disattivato
    // await this.perfMonitor.measure('loadRootNodes', async () => {
    try {
      const dtos = await this.ipcGateway.getClasses();
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
      const appError: AppError = {
        code: ErrorCode.LOAD_CHILDREN_FAILED,
        category: ErrorCategory.IPC,
        context: 'ImportFacade.loadChildren',
        message: (err as Error).message ?? `Errore caricamento figli (nodeId: root)`,
        recoverable: true,
        severity: ErrorSeverity.ERROR,
        source: 'DipIpcGateway',
        detail: JSON.stringify({}),
      };
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
      const dtos = await this.ipcGateway.loadChildren(nodeId);
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
      const appError: AppError = {
        code: ErrorCode.LOAD_CHILDREN_FAILED,
        category: ErrorCategory.IPC,
        context: 'ImportFacade.loadChildren',
        message: (err as Error).message ?? `Errore caricamento figli (nodeId: ${nodeId})`,
        recoverable: true,
        severity: ErrorSeverity.ERROR,
        source: 'DipIpcGateway',
        detail: JSON.stringify({ nodeId }),
      };
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
