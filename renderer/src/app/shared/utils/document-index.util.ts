import { DocumentIndexEntryDTO } from '../domain/dto/AggregateDTO';
import { MetadataExtractor } from './metadata-extractor.util';
import { normalizeMetadataNodes } from './metadata-nodes.util';

interface DocumentLike {
  id: number | string;
  uuid?: string | null;
  metadata: unknown;
}

export function resolveDocumentLabel(document: DocumentLike, fallback = 'Documento'): string {
  const extractor = new MetadataExtractor(normalizeMetadataNodes(document.metadata));
  const candidates = [
    extractor.getString('NomeDelDocumento', '').trim(),
    extractor.getString('Oggetto', '').trim(),
    document.uuid?.trim() || '',
  ];

  for (const candidate of candidates) {
    if (candidate.length > 0) {
      return candidate;
    }
  }

  return fallback;
}

export function mapDocumentsToIndexEntries(
  documents: DocumentLike[] | null | undefined,
): DocumentIndexEntryDTO[] {
  if (!Array.isArray(documents) || documents.length === 0) {
    return [];
  }

  return documents.map((document) => ({
    tipoDocumento: 'Documento',
    identificativo: resolveDocumentLabel(document),
    routeId: String(document.id),
  }));
}
