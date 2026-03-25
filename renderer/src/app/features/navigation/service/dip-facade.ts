import { Injectable, signal, Signal, WritableSignal, inject } from "@angular/core";
import { IpcGateway } /*aggiungere*/;
import { DipTreeNode } from "../contracts/dip-tree-node";
import { AppError } from "../contracts/app-error";

export interface DipState {
    phase: 'ready' | 'loading' | 'idle';
    rootNodes: DipTreeNode[];
    nodeCache: Map<NodeId,DipTreeNode[]>;
    //dividiamo tra gli errori dei sottonodi non bloccanti
    //e tra gli errori alla radice, che sono bloccanti
    nodeChildrenErrors: Map<NodeId,AppError>;
    rootError?: AppError;
}

@Injectable({ providedIn: 'root' })
export class DipFacade {
    private readonly state: WritableSignal<DipState> = signal({
        phase: 'idle',
        rootNodes: [],
        nodeCache: new Map<NodeId, DipTreeNode[]>(),
        nodeChildrenErrors: new Map<NodeId, AppError>()
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
            const appError: AppError = {
                code: 'DIP_FILE_NOT_FOUND', 
                message: (error as Error).message,
                recoverable: false,
                details: null
            };
        
            this.state.set({
                ...this.state(),
                phase: 'idle',          // o 'error' se vuoi distinguere
                rootError: appError     // nuovo campo nel signal
            });
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
            const appError: AppError = {
                code: 'DIP_CHILDREN_LOAD_ERROR',
                message: (error as Error).message,
                recoverable: true,
                details: { nodeId }
            };
        
            const newErrors = new Map(this.state().nodeChildrenErrors);
            newErrors.set(nodeId, appError);
        
            this.state.set({
                ...this.state(),
                nodeChildrenErrors: newErrors,
            });
            }
    }
}