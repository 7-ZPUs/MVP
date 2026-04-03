import { DipTreeNode } from "./dip-tree-node";
import { AppError } from "./app-error";
import { NodeId } from "../domain/types";

export interface FlatNode {
    node: DipTreeNode;
    depth: number;
    hasChildren: boolean;
    isLoading: boolean;
    isExpanded: boolean;
    isSelected: boolean;
    parentId?: NodeId;
    childrenError?: AppError;
    timestamp?: string;
    verificationStatus?: string;
}