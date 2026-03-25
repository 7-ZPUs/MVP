import { DipTreeNode } from "./dip-tree-node";
import { AppError } from "./app-error";

export interface FlatNode {
    node: DipTreeNode;
    depth: number;
    hasChildren: boolean;
    isLoading: boolean;
    isExpanded: boolean;
    parentId?: NodeId;
    childrenError?: AppError;
    timestamp?: string;
    verificationStatus?: string;

}