import { NodeId } from "../domain/types";
export interface DipTreeNode {
    name: string,
    id: NodeId,
    type: 'class' | 'document' | 'process',
    hasChildren: boolean,
    isLoading: boolean,
    /*si potrebbe aggiungere il riferimento al nodo padre
    o se si ha un errore nel nodo figlio*/    
}