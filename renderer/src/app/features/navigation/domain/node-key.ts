import { DipTreeNode } from '../contracts/dip-tree-node';
import { NodeId } from './types';

export type NodeKey = `${DipTreeNode['type']}:${NodeId}`;

export function buildNodeKey(node: Pick<DipTreeNode, 'type' | 'id'>): NodeKey {
  return `${node.type}:${node.id}` as NodeKey;
}