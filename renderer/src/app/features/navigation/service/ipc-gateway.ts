import { Injectable } from "@angular/core";
import { DipTreeNode } from "../contracts/dip-tree-node";

@Injectable({ providedIn: 'root' })
export class IpcGateway {

  async loadChildren(nodeId: NodeId): Promise<DipTreeNode[]> {

    // ⏱ Simula latenza
    await this.delay(500);

    // 💥 Simula errore casuale (30%)
    if (Math.random() < 0.3) {
      throw new Error('Simulated load error');
    }

    // 🌱 ROOT NODES
    if (nodeId === 'root') {
      return [
        { id: 'c1', name: 'Class A', type: 'class', hasChildren: true, isLoading: false},
        { id: 'p1', name: 'Process X', type: 'process', hasChildren: true, isLoading: false },
        { id: 'd1', name: 'Document 1', type: 'document', hasChildren: false, isLoading: false },
      ];
    }

    // 🌿 CHILDREN
    return [
      {
        id: `${nodeId}-1`,
        name: `Child 1 of ${nodeId}`,
        type: 'document',
        hasChildren: false,
        isLoading: false,
      },
      {
        id: `${nodeId}-2`,
        name: `Child 2 of ${nodeId}`,
        type: 'process',
        hasChildren: true,
        isLoading: false,
      }
    ];
  }

  // Stub per ora
  async getClasses(): Promise<any[]> {
    return [];
  }

  async getProcesses(): Promise<any[]> {
    return [];
  }

  async getDocuments(): Promise<any[]> {
    return [];
  }

  // helper
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}