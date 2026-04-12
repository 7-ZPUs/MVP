import {
  ProcessConservationData,
  ProcessCoreMetadata,
  ProcessCustomMetadataEntry,
  ProcessDetail,
  ProcessDocumentClassInfo,
  ProcessOverviewData,
  ProcessSubmissionData,
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
  'StatoProcesso',
  'ProcessStatus',
  'Status',
  'Stato',
  'PreservationProcessUUID',
  'Sessione',
  'PreservationProcessDate',
  'PreservationProcessEnd',
  'UUIDAttivatore',
  'UUIDTerminatore',
  'TipoAttivazione',
  'TipoTerminazione',
  'DataApertura',
  'DataChiusura',
  'SessioneVersamento.Processo',
  'SessioneVersamento.Sessione',
  'SessioneVersamento.DataInizio',
  'SessioneVersamento.DataFine',
  'SessioneVersamento.UUIDAttivatore',
  'SessioneVersamento.UUIDTerminatore',
  'SessioneVersamento.CanaleAttivazione',
  'SessioneVersamento.CanaleTerminazione',
  'SessioneVersamento.Stato',
  'SessioneConservazione.Processo',
  'SessioneConservazione.Sessione',
  'SessioneConservazione.DataInizio',
  'SessioneConservazione.DataFine',
  'SessioneConservazione.UUIDAttivatore',
  'SessioneConservazione.UUIDTerminatore',
  'SessioneConservazione.CanaleAttivazione',
  'SessioneConservazione.CanaleTerminazione',
  'SessioneConservazione.Stato',
  'CustomMetadata',
  'ArchimemoData',
]);

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

function firstDefined(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    if (!value) {
      continue;
    }

    const normalized = value.trim();
    if (normalized.length > 0) {
      return normalized;
    }
  }

  return undefined;
}

function getFirstString(extractor: MetadataExtractor, ...keys: string[]): string | undefined {
  return firstDefined(...keys.map((key) => extractor.getString(key, '')));
}

function createScopedExtractor(value: unknown): MetadataExtractor | null {
  const scopedNodes = normalizeMetadataNodes(value);
  return scopedNodes.length > 0 ? new MetadataExtractor(scopedNodes) : null;
}

function getScopedExtractor(
  extractor: MetadataExtractor | null,
  blockName: string,
): MetadataExtractor | null {
  if (!extractor) {
    return null;
  }

  return createScopedExtractor(extractor.findValue(blockName));
}

function getScopedValue(
  extractor: MetadataExtractor | null,
  blockName: string,
  fieldName: string,
): string | undefined {
  const blockExtractor = getScopedExtractor(extractor, blockName);
  return blockExtractor ? firstDefined(blockExtractor.getString(fieldName, '')) : undefined;
}

function getAttributeValue(
  extractor: MetadataExtractor | null,
  attributeName: string,
): string | undefined {
  if (!extractor) {
    return undefined;
  }

  const attributeExtractor = createScopedExtractor(extractor.findValue('$'));
  const fromAttributeBlock = attributeExtractor
    ? firstDefined(
        attributeExtractor.getString(attributeName, ''),
        attributeExtractor.getString(`@_${attributeName}`, ''),
        attributeExtractor.getString(`ark-aip:${attributeName}`, ''),
      )
    : undefined;

  return (
    fromAttributeBlock ??
    firstDefined(
      extractor.getString(attributeName, ''),
      extractor.getString(`@_${attributeName}`, ''),
      extractor.getString(`ark-aip:${attributeName}`, ''),
    )
  );
}

function mapProcessOverview(extractor: MetadataExtractor): ProcessOverviewData {
  return {
    oggetto: extractor.getString('Oggetto', 'N/A'),
    procedimento: extractor.getString('Procedimento', 'N/A'),
    materiaArgomentoStruttura: extractor.getString('MateriaArgomentoStruttura', 'N/A'),
  };
}

function mapProcessSubmission(
  rootExtractor: MetadataExtractor,
  processExtractor: MetadataExtractor,
  fallbackProcessUuid: string,
): ProcessSubmissionData {
  const submissionExtractor = getScopedExtractor(processExtractor, 'SubmissionSession');

  return {
    processo:
      firstDefined(getFirstString(rootExtractor, 'SessioneVersamento.Processo'), fallbackProcessUuid) ??
      'N/A',
    sessione:
      firstDefined(
        getAttributeValue(submissionExtractor, 'uuid'),
        getFirstString(rootExtractor, 'SessioneVersamento.Sessione'),
        rootExtractor.getString('Sessione', ''),
      ) ?? 'N/A',
    dataInizio:
      firstDefined(
        getScopedValue(submissionExtractor, 'Start', 'Date'),
        getFirstString(rootExtractor, 'SessioneVersamento.DataInizio'),
        getScopedValue(processExtractor, 'Start', 'Date'),
        rootExtractor.getString('DataApertura', ''),
      ) ?? 'N/A',
    dataFine: firstDefined(
      getScopedValue(submissionExtractor, 'End', 'Date'),
      getFirstString(rootExtractor, 'SessioneVersamento.DataFine'),
    ),
    uuidAttivatore: firstDefined(
      getScopedValue(submissionExtractor, 'Start', 'UserUUID'),
      getFirstString(rootExtractor, 'SessioneVersamento.UUIDAttivatore', 'UUIDAttivatore'),
    ),
    uuidTerminatore: firstDefined(
      getScopedValue(submissionExtractor, 'End', 'UserUUID'),
      getFirstString(rootExtractor, 'SessioneVersamento.UUIDTerminatore', 'UUIDTerminatore'),
    ),
    canaleAttivazione: firstDefined(
      getScopedValue(submissionExtractor, 'Start', 'Source'),
      getFirstString(rootExtractor, 'SessioneVersamento.CanaleAttivazione', 'TipoAttivazione'),
    ),
    canaleTerminazione: firstDefined(
      getScopedValue(submissionExtractor, 'End', 'Source'),
      getFirstString(rootExtractor, 'SessioneVersamento.CanaleTerminazione', 'TipoTerminazione'),
    ),
    stato: firstDefined(
      getScopedValue(submissionExtractor, 'End', 'Status'),
      getFirstString(rootExtractor, 'SessioneVersamento.Stato'),
    ),
  };
}

function mapProcessConservation(
  rootExtractor: MetadataExtractor,
  processExtractor: MetadataExtractor,
  fallbackProcessUuid: string,
): ProcessConservationData {
  const preservationExtractor = getScopedExtractor(processExtractor, 'PreservationSession');

  return {
    processo:
      firstDefined(
        getFirstString(rootExtractor, 'SessioneConservazione.Processo', 'PreservationProcessUUID'),
        fallbackProcessUuid,
      ) ?? 'N/A',
    sessione:
      firstDefined(
        getAttributeValue(preservationExtractor, 'uuid'),
        getFirstString(rootExtractor, 'SessioneConservazione.Sessione'),
        rootExtractor.getString('Sessione', ''),
      ) ?? 'N/A',
    dataInizio:
      firstDefined(
        getScopedValue(preservationExtractor, 'Start', 'Date'),
        getFirstString(rootExtractor, 'SessioneConservazione.DataInizio'),
        rootExtractor.getString('PreservationProcessDate', ''),
        rootExtractor.getString('DataApertura', ''),
      ) ?? 'N/A',
    dataFine: firstDefined(
      getScopedValue(preservationExtractor, 'End', 'Date'),
      getFirstString(rootExtractor, 'SessioneConservazione.DataFine'),
      rootExtractor.getString('PreservationProcessEnd', ''),
    ),
    uuidAttivatore: firstDefined(
      getScopedValue(preservationExtractor, 'Start', 'UserUUID'),
      getFirstString(rootExtractor, 'SessioneConservazione.UUIDAttivatore', 'UUIDAttivatore'),
    ),
    uuidTerminatore: firstDefined(
      getScopedValue(preservationExtractor, 'End', 'UserUUID'),
      getFirstString(rootExtractor, 'SessioneConservazione.UUIDTerminatore', 'UUIDTerminatore'),
    ),
    canaleAttivazione: firstDefined(
      getScopedValue(preservationExtractor, 'Start', 'Source'),
      getFirstString(rootExtractor, 'SessioneConservazione.CanaleAttivazione', 'TipoAttivazione'),
    ),
    canaleTerminazione: firstDefined(
      getScopedValue(preservationExtractor, 'End', 'Source'),
      getFirstString(rootExtractor, 'SessioneConservazione.CanaleTerminazione', 'TipoTerminazione'),
    ),
    stato: firstDefined(
      getScopedValue(preservationExtractor, 'End', 'Status'),
      getFirstString(rootExtractor, 'SessioneConservazione.Stato'),
    ),
  };
}

function mapProcessStatus(
  rootExtractor: MetadataExtractor,
  processExtractor: MetadataExtractor,
): string | undefined {
  return firstDefined(
    getScopedValue(processExtractor, 'End', 'Status'),
    getFirstString(rootExtractor, 'StatoProcesso', 'ProcessStatus', 'Status', 'Stato'),
  );
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
  processStatus?: string,
): ProcessCoreMetadata {
  return {
    processId,
    processUuid,
    integrityStatus,
    processStatus,
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
  const processExtractor = getScopedExtractor(extractor, 'Process');
  const scopedProcessExtractor = processExtractor ?? extractor;
  const processStatus = mapProcessStatus(extractor, scopedProcessExtractor);
  const resolvedProcessUuid =
    firstDefined(
      extractor.getString('PreservationProcessUUID', ''),
      getAttributeValue(scopedProcessExtractor, 'uuid'),
      processUuid,
    ) ?? 'N/A';

  return {
    processId,
    processUuid,
    integrityStatus,
    metadata: mapProcessCoreMetadata(
      processId,
      processUuid,
      integrityStatus,
      documentClass,
      processStatus,
    ),
    overview: mapProcessOverview(extractor),
    submission: mapProcessSubmission(extractor, scopedProcessExtractor, resolvedProcessUuid),
    conservation: mapProcessConservation(extractor, scopedProcessExtractor, resolvedProcessUuid),
    documentClass,
    customMetadata: mapProcessCustomMetadata(extractor),
    indiceDocumenti: [],
  };
}
