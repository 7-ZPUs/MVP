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
import { normalizeDisplayFileName } from '../../../shared/utils/display-file-name.util';
import { normalizeMetadataNodes } from '../../../shared/utils/metadata-nodes.util';

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
        name: this.resolveNodeName(null, 'dip'),
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
          name: this.resolveNodeName(dto.name, 'documentClass'),
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
        dtos.map((dto) => {
          let name = this.resolveNodeName(
            this.extractMetadataName(dto.metadata, ['Oggetto', 'Procedimento', 'IdAggregazione']),
            'process',
          );

          const date = this.extractProcessDate(dto.metadata);
          if (date) {
            name = name === 'Processo' ? `Processo del ${date}` : `${name} del ${date}`;
          }

          return {
            id: dto.id,
            name,
            type: 'process',
            hasChildren: true,
          };
        }),
    );
  }

  private formatProcessDate(dateStr: string): string {
    if (!dateStr) return '';
    // Optional: simply use the substring before 'T' if it's ISO, and possibly replace '-' with '/'
    return dateStr.split('T')[0].trim().replaceAll('-', '/');
  }

  private extractProcessDate(metadata: unknown): string | null {
    const nodes = normalizeMetadataNodes(metadata);
    if (nodes.length === 0) return null;

    const extractor = new MetadataExtractor(nodes);

    // First, look exactly how process.mapper.ts does it.
    // Sometimes it's dot-notation "SessioneVersamento.DataInizio" or just "DataInizio" etc.
    let date = extractor.getString('SessioneVersamento.DataInizio', '').trim();
    if (!date) {
      date = extractor.getString('Start.Date', '').trim();
    }
    if (!date) {
      date = extractor.getString('DataApertura', '').trim();
    }
    if (!date) {
      date = extractor.getString('DataInizio', '').trim();
    }
    if (!date) {
      date = extractor.getString('SessioneVersamento.DataFine', '').trim();
    }
    if (!date) {
      date = extractor.getString('End.Date', '').trim();
    }
    if (!date) {
      date = extractor.getString('DataFine', '').trim();
    }

    // Nested SessioneVersamento
    if (!date) {
      const sessione = extractor.findValue('SessioneVersamento');
      if (sessione && Array.isArray(sessione)) {
        const sessionExtractor = new MetadataExtractor(
          sessione as import('../../../shared/utils/metadata-nodes.util').MetadataNode[],
        );
        date = sessionExtractor.getString('DataInizio', '').trim();
        if (!date) {
          date = sessionExtractor.getString('DataFine', '').trim();
        }
      }
    }

    // Nested SubmissionSession.Start.Date
    if (!date) {
      const submission = extractor.findValue('SubmissionSession');
      if (submission && Array.isArray(submission)) {
        const subEx = new MetadataExtractor(
          submission as import('../../../shared/utils/metadata-nodes.util').MetadataNode[],
        );
        const start = subEx.findValue('Start');
        if (start && Array.isArray(start)) {
          const startEx = new MetadataExtractor(
            start as import('../../../shared/utils/metadata-nodes.util').MetadataNode[],
          );
          date = startEx.getString('Date', '').trim();
        }
      }
    }

    return date ? this.formatProcessDate(date) : null;
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
          name: this.resolveNodeName(normalizeDisplayFileName(dto.filename), 'file'),
          type: 'file',
          hasChildren: false, // foglia
        })),
    );
  }

  private resolveNodeName(
    preferredName: string | null | undefined,
    nodeType: DipTreeNode['type'],
  ): string {
    const normalized = preferredName?.trim();
    if (normalized && normalized.length > 0) {
      return normalized;
    }

    return this.buildFallbackName(nodeType);
  }

  private extractMetadataName(metadata: unknown, keys: string[]): string | null {
    const nodes = normalizeMetadataNodes(metadata);

    if (nodes.length === 0) {
      return null;
    }

    const extractor = new MetadataExtractor(nodes);
    for (const key of keys) {
      const value = extractor.getString(key, '').trim();
      if (value.length > 0) {
        return value;
      }
    }

    return null;
  }

  private buildFallbackName(nodeType: DipTreeNode['type']): string {
    switch (nodeType) {
      case 'dip':
        return 'DIP';
      case 'documentClass':
        return 'Classe Documentale';
      case 'process':
        return 'Processo';
      case 'document':
        return 'Documento';
      case 'file':
        return 'File';
    }
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
    } catch (error_) {
      throw this.errorHandler.handle(error_);
    }
  }
}
