import { Injectable, inject } from '@angular/core';
import { IpcCacheService } from '../../../shared/services/ipc-cache.service';
import { IpcErrorHandlerService } from '../../../shared/services/ipc-error-handler.service';
import { DipTreeNode } from '../contracts/dip-tree-node';
import { ELECTRON_CONTEXT_BRIDGE_TOKEN } from '../../../shared/contracts';
import { IpcChannels } from '../../../../../../shared/ipc-channels';
import { DipDTO } from '../../../shared/domain/dto/DipDTO';
import { DocumentClassDTO } from '../../../shared/domain/dto/DocumentClassDTO';
import { DocumentDTO } from '../../../shared/domain/dto/DocumentDTO';
import { FileDTO } from '../../../shared/domain/dto/FileDTO';
import { ProcessDTO } from '../../../shared/domain/dto/ProcessDTO';
import { MetadataExtractor } from '../../../shared/utils/metadata-extractor.util';

@Injectable({ providedIn: 'root' })
export class IpcGateway {
  private readonly TTL = 600_000;
  private readonly bridge = inject(ELECTRON_CONTEXT_BRIDGE_TOKEN);
  private readonly cache = inject(IpcCacheService);
  private readonly errorHandler = inject(IpcErrorHandlerService);

  /**
   * Entry point unico per DipFacade.
   * Sceglie il canale giusto in base al tipo del nodo padre.
   */
  async getChildren(parent: DipTreeNode): Promise<DipTreeNode[]> {
    switch (parent.type) {
      case 'dip':
        return this.getDocumentClasses(parent.id);

      case 'documentClass':
        return this.getProcesses(parent.id);

      case 'process':
        return this.getDocuments(parent.id);

      case 'document':
        return this.getFiles(parent.id);

      case 'file':
        // i file sono foglie — non hanno figli
        return [];
    }
  }

  // ── DIP ────────────────────────────────────────────────────

  async getRootDip(dipId: number): Promise<DipTreeNode> {
    return this.invokeWithCache(
      IpcChannels.BROWSE_GET_DIP_BY_ID,
      dipId,
      this.TTL,
      `dip:${dipId}`,
      (dto: DipDTO): DipTreeNode => ({
        id: dto.id,
        name: this.resolveNodeName(null, 'dip', dto.id),
        type: 'dip',
        hasChildren: true,
      }),
    );
  }

  // ── DocumentClass ───────────────────────────────────────────

  private async getDocumentClasses(dipId: number): Promise<DipTreeNode[]> {
    return this.invokeWithCache(
      IpcChannels.BROWSE_GET_DOCUMENT_CLASS_BY_DIP_ID,
      dipId,
      this.TTL,
      `documentClasses:${dipId}`,
      (dtos: DocumentClassDTO[]): DipTreeNode[] =>
        dtos.map((dto) => ({
          id: dto.id,
          name: this.resolveNodeName(dto.name, 'documentClass', dto.id),
          type: 'documentClass',
          hasChildren: true,
        })),
    );
  }

  // ── Process ─────────────────────────────────────────────────

  private async getProcesses(documentClassId: number): Promise<DipTreeNode[]> {
    return this.invokeWithCache(
      IpcChannels.BROWSE_GET_PROCESS_BY_DOCUMENT_CLASS,
      documentClassId,
      this.TTL,
      `processes:${documentClassId}`,
      (dtos: ProcessDTO[]): DipTreeNode[] =>
        dtos.map((dto) => ({
          id: dto.id,
          name: this.resolveNodeName(
            this.extractMetadataName(dto.metadata, ['Oggetto', 'Procedimento', 'IdAggregazione']),
            'process',
            dto.id,
          ),
          type: 'process',
          hasChildren: true,
        })),
    );
  }

  // ── Document ─────────────────────────────────────────────────

  private async getDocuments(processId: number): Promise<DipTreeNode[]> {
    return this.invokeWithCache(
      IpcChannels.BROWSE_GET_DOCUMENTS_BY_PROCESS,
      processId,
      this.TTL,
      `documents:${processId}`,
      (dtos: DocumentDTO[]): DipTreeNode[] =>
        dtos.map((dto) => ({
          id: dto.id,
          name: this.resolveNodeName(
            this.extractMetadataName(dto.metadata, ['NomeDelDocumento', 'Oggetto']),
            'document',
            dto.id,
          ),
          type: 'document',
          hasChildren: true, // ha sempre file
        })),
    );
  }

  // ── File ─────────────────────────────────────────────────────

  private async getFiles(documentId: number): Promise<DipTreeNode[]> {
    return this.invokeWithCache(
      IpcChannels.BROWSE_GET_FILE_BY_DOCUMENT,
      documentId,
      this.TTL,
      `files:${documentId}`,
      (dtos: FileDTO[]): DipTreeNode[] =>
        dtos.map((dto) => ({
          id: dto.id,
          name: this.resolveNodeName(dto.filename, 'file', dto.id),
          type: 'file',
          hasChildren: false, // foglia
        })),
    );
  }

  private resolveNodeName(
    preferredName: string | null | undefined,
    nodeType: DipTreeNode['type'],
    nodeId: number,
  ): string {
    const normalized = preferredName?.trim();
    if (normalized && normalized.length > 0) {
      return normalized;
    }

    return this.buildFallbackName(nodeType, nodeId);
  }

  private extractMetadataName(metadata: unknown, keys: string[]): string | null {
    if (!Array.isArray(metadata) || metadata.length === 0) {
      return null;
    }

    const extractor = new MetadataExtractor(metadata as Array<{ name: string; value: unknown }>);
    for (const key of keys) {
      const value = extractor.getString(key, '').trim();
      if (value.length > 0) {
        return value;
      }
    }

    return null;
  }

  private buildFallbackName(nodeType: DipTreeNode['type'], nodeId: number): string {
    const idPrefix = this.getIdPrefix(nodeId);

    switch (nodeType) {
      case 'dip':
        return `DIP ${idPrefix}`;
      case 'documentClass':
        return `Classe Documentale ${idPrefix}`;
      case 'process':
        return `Processo ${idPrefix}`;
      case 'document':
        return `Documento ${idPrefix}`;
      case 'file':
        return `File ${idPrefix}`;
    }
  }

  private getIdPrefix(nodeId: number): string {
    return String(nodeId).slice(0, 5);
  }

  // ── Infrastruttura ────────────────────────────────────────────

  private async invokeWithCache<TDto, TResult>(
    channel: string,
    payload: unknown,
    ttl: number,
    cacheKey: string,
    mapper: (dto: TDto) => TResult,
  ): Promise<TResult> {
    const cached = this.cache.get<TResult>(cacheKey);
    if (cached !== null) return cached;

    try {
      const dto = await this.bridge.invoke<TDto>(channel, payload);
      const result = mapper(dto);
      this.cache.set(cacheKey, result, ttl);
      return result;
    } catch (raw) {
      throw this.errorHandler.handle(raw);
    }
  }
}
