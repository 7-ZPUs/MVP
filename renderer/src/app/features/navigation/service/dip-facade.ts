import { Injectable, signal, Signal, WritableSignal, inject } from "@angular/core";
import { IpcGateway } /*aggiungere*/;
import { DipTreeNode } from "../contracts/dip-tree-node";

export interface DipState {
    phase: 'ready' | 'loading' | 'idle';
    rootNodes: DipTreeNode[];
    nodeCache: Map<NodeId,DipTreeNode[]>;
}

@Injectable({ providedIn: 'root' })
export class DipFacade {
    private readonly state: WritableSignal<DipState> = signal({
        phase: 'idle',
        rootNodes: [],
        nodeCache: new Map<string, DipTreeNode[]>(),
    })

    ipcGateway = inject(IpcGateway);

    public getState(): Signal<DipState> {
        return this.state.asReadonly();
    }

    public async loadRootNodes(): Promise<void> {
        this.state.set({
            ...this.state(), 
            phase: 'loading',
        });
    
        try {
          // Utilizziamo il valore speciale 'root' per i nodi radice
          const nodes: DipTreeNode[] = await this.ipcGateway.loadChildren('root');
    
          this.state.set({
            ...this.state(),
            phase: 'ready',
            rootNodes: nodes,
          });
        } catch (error) {
          /*manca gestione degli errori*/
        }
    }
    
    public async loadChildren(nodeId: NodeId): Promise<void> {
        this.state.set({
            ...this.state(), 
            phase: 'loading',
        });
    
        try {
            const childrenNodes: DipTreeNode[] = await this.ipcGateway.loadChildren(nodeId);

            const newCache = new Map(this.state().nodeCache);
            newCache.set(nodeId, childrenNodes);

            this.state.set({
                ...this.state(),
                nodeCache: newCache
            });
        } catch (error) {
                // TODO
            }
    }
}