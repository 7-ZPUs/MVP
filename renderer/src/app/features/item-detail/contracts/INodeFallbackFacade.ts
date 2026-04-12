import { InjectionToken, Signal } from '@angular/core';
import { NodeFallbackItemType, NodeFallbackState } from '../domain/node-fallback.models';

export interface INodeFallbackFacade {
  getState(): Signal<NodeFallbackState>;
  loadNode(itemType: NodeFallbackItemType, id: string): Promise<void>;
}

export const NODE_FALLBACK_FACADE_TOKEN = new InjectionToken<INodeFallbackFacade>(
  'INodeFallbackFacade',
);