import { DipTreeNode } from "./dip-tree-node";

export interface FlatNode {
    node: DipTreeNode;
    depth: number;
    hasChildren: boolean;
    isLoading: boolean;
    //TODO aggiungere children error
}