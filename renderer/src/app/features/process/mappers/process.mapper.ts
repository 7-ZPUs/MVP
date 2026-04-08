import { ProcessDetail } from '../domain/process.models';
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

function optionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function mapProcessDtoToDetail(dto: unknown): ProcessDetail {
  const source: RawProcessDto = dto && typeof dto === 'object' ? (dto as RawProcessDto) : {};
  const nodes = normalizeMetadataNodes(source.metadata);
  const extractor = new MetadataExtractor(nodes);

  const explicitCustomData = extractor.extractCustomDataPairs(['CustomMetadata', 'ArchimemoData']);
  const genericCustomData = extractor.extractGenericUnmappedCustomMetadata(
    KNOWN_PROCESS_XSD_ROOT_BLOCKS,
  );

  const processUuid = String(source.uuid || '').trim() || 'N/D';
  const documentClassId = optionalNumber(source.documentClassId);

  return {
    processId: String(source.id ?? ''),
    processUuid,
    integrityStatus: String(source.integrityStatus || 'UNKNOWN'),
    overview: {
      oggetto: extractor.getString('Oggetto', 'N/A'),
      procedimento: extractor.getString('Procedimento', 'N/A'),
      materiaArgomentoStruttura: extractor.getString('MateriaArgomentoStruttura', 'N/A'),
    },
    conservation: {
      processo: extractor.getString('PreservationProcessUUID', processUuid),
      sessione: extractor.getString('Sessione', 'N/A'),
      dataInizio: extractor.getString(
        'PreservationProcessDate',
        extractor.getString('DataApertura', 'N/A'),
      ),
      dataFine: optionalString(extractor.getString('PreservationProcessEnd', '')),
      uuidTerminatore: optionalString(extractor.getString('UUIDTerminatore', '')),
      canaleTerminazione: optionalString(extractor.getString('TipoTerminazione', '')),
    },
    documentClass: {
      id: documentClassId,
    },
    customMetadata: [...explicitCustomData, ...genericCustomData],
    indiceDocumenti: [],
  };
}
