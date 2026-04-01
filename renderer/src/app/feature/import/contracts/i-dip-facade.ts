import { Signal } from '@angular/core';
import { DipTreeNode } from '../domain/models';
import { ImportPhase } from '../domain/enums';
 
export interface IDipFacade {
  rootNodes:        Signal<DipTreeNode[]>;
  selectedDocument: Signal<DipTreeNode | null>;
  loading:          Signal<boolean>;
  phase:            Signal<ImportPhase>;
  loadRootNodes():             Promise<void>;
  loadChildren(nodeId: string): Promise<void>;
  selectDocument(node: DipTreeNode): void;
  retryLoad(): void;
  clearCache(): void;
}