import { InjectionToken, Signal } from '@angular/core';
import { DocumentState } from '../domain/document.models';

export interface IDocumentFacade {
  getState(): Signal<DocumentState>;
  loadDocument(id: string): void;
  getFileBlob(documentId: string): Promise<Uint8Array | null>;
}

export const DOCUMENT_FACADE_TOKEN = new InjectionToken<IDocumentFacade>('IDocumentFacade');
