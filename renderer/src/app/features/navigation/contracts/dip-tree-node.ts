import { NodeId } from "../domain/types";
export interface DipTreeNode {
    name: string;
    id: NodeId;
    type: 'document' | 'file' | 'process' | 'documentClass' | 'dip';
    hasChildren: boolean;
    timestamp?: string;
  }