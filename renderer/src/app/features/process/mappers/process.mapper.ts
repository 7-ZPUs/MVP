import {
  ProcessConservationData,
  ProcessCoreMetadata,
  ProcessCustomMetadataEntry,
  ProcessDetail,
  ProcessDocumentClassInfo,
  ProcessOverviewData,
} from '../domain/process.models';
import { MetadataExtractor } from '../../../shared/utils/metadata-extractor.util';
import { normalizeMetadataNodes } from '../../../shared/utils/metadata-nodes.util';

interface RawProcessDto {
  id?: unknown;
  uuid?: unknown;
  integrityStatus?: unknown;
  documentClassId?: unknown;
  metadata?: unknown;
}

const KNOWN_PROCESS_XSD_ROOT_BLOCKS = new Set<string>([
  'Oggetto',
  'Procedimento',
  'MateriaArgomentoStruttura',
  'PreservationProcessUUID',
  'Sessione',
  'PreservationProcessDate',
  'PreservationProcessEnd',
  'UUIDTerminatore',
  'TipoTerminazione',
  'DataApertura',
  'DataChiusura',
  'CustomMetadata',
  'ArchimemoData',
]);

function optionalString(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function requiredString(value: unknown, fallback = 'N/A'): string {
  if (value === null || value === undefined) {
    return fallback;
  }

  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : fallback;
}

function optionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapProcessOverview(extractor: MetadataExtractor): ProcessOverviewData {
  return {
    oggetto: extractor.getString('Oggetto', 'N/A'),
    procedimento: extractor.getString('Procedimento', 'N/A'),
    materiaArgomentoStruttura: extractor.getString('MateriaArgomentoStruttura', 'N/A'),
  };
}

function mapProcessConservation(
  extractor: MetadataExtractor,
  fallbackProcessUuid: string,
): ProcessConservationData {
  return {
    processo: extractor.getString('PreservationProcessUUID', fallbackProcessUuid),
    sessione: extractor.getString('Sessione', 'N/A'),
    dataInizio: extractor.getString(
      'PreservationProcessDate',
      extractor.getString('DataApertura', 'N/A'),
    ),
    dataFine: optionalString(extractor.getString('PreservationProcessEnd', '')),
    uuidTerminatore: optionalString(extractor.getString('UUIDTerminatore', '')),
    canaleTerminazione: optionalString(extractor.getString('TipoTerminazione', '')),
  };
}

function mapProcessDocumentClass(
  source: RawProcessDto,
  extractor: MetadataExtractor,
): ProcessDocumentClassInfo {
  return {
    id: optionalNumber(source.documentClassId),
    name: extractor.getString('ClasseDocumentale', 'N/A'),
    uuid: extractor.getString('UUIDClasseDocumentale', 'N/A'),
    timestamp: extractor.getString('TimestampClasseDocumentale', 'N/A'),
  };
}

function mapProcessCustomMetadata(extractor: MetadataExtractor): ProcessCustomMetadataEntry[] {
  const explicitCustomData = extractor.extractCustomDataPairs(['CustomMetadata', 'ArchimemoData']);
  const genericCustomData = extractor.extractGenericUnmappedCustomMetadata(
    KNOWN_PROCESS_XSD_ROOT_BLOCKS,
  );

  return [...explicitCustomData, ...genericCustomData];
}

function mapProcessCoreMetadata(
  processId: string,
  processUuid: string,
  integrityStatus: string,
  documentClass: ProcessDocumentClassInfo,
): ProcessCoreMetadata {
  return {
    processId,
    processUuid,
    integrityStatus,
    documentClassName: requiredString(documentClass.name),
    documentClassUuid: requiredString(documentClass.uuid),
    documentClassTimestamp: requiredString(documentClass.timestamp),
  };
}

export function mapProcessDtoToDetail(dto: unknown): ProcessDetail {
  const source: RawProcessDto = dto && typeof dto === 'object' ? (dto as RawProcessDto) : {};
  const nodes = normalizeMetadataNodes(source.metadata);
  const extractor = new MetadataExtractor(nodes);

  const processId = requiredString(source.id);
  const processUuid = requiredString(source.uuid);
  const integrityStatus = requiredString(source.integrityStatus, 'UNKNOWN');
  const documentClass = mapProcessDocumentClass(source, extractor);

  return {
    processId,
    processUuid,
    integrityStatus,
    metadata: mapProcessCoreMetadata(processId, processUuid, integrityStatus, documentClass),
    overview: mapProcessOverview(extractor),
    conservation: mapProcessConservation(extractor, processUuid),
    documentClass,
    customMetadata: mapProcessCustomMetadata(extractor),
    indiceDocumenti: [],
  };
}
