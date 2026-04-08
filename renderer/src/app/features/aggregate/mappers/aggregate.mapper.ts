import {
  AggregateDetailDTO,
  TipologiaFascicoloEnum,
  TipoAggregazioneEnum,
} from '../../../shared/domain/dto/AggregateDTO';
import { MetadataExtractor } from '../../../shared/utils/metadata-extractor.util';
import { normalizeMetadataNodes } from '../../../shared/utils/metadata-nodes.util';

interface AggregateSourceDto {
  id?: unknown;
  uuid?: unknown;
  integrityStatus?: unknown;
  metadata?: unknown;
}

// Known XSD tags for aggregation. Any root fields outside these are grouped generically
const KNOWN_AGGREGATE_XSD_ROOT_BLOCKS = new Set<string>([
  'IdAgg',
  'TipologiaFascicolo',
  'Soggetti',
  'Assegnazione',
  'DataApertura',
  'Classificazione',
  'Progressivo',
  'ChiaveDescrittiva',
  'DataChiusura',
  'ProcedimentoAmministrativo',
  'IndiceDocumenti',
  'PosizioneFisicaAggregazioneDocumentale',
  'IdAggPrimario',
  'TempoDiConservazione',
  'Note',
  'CustomMetadata',
  'ArchimemoData',
]);

/**
 * Mapper for converting a backend ProcessDTO (with a nested MetadataDTO structure)
 * into the frontend's AggregateDetailDTO (Fascicolo).
 */
export function mapProcessDtoToAggregateDetail(dto: unknown): AggregateDetailDTO {
  const source: AggregateSourceDto = dto && typeof dto === 'object' ? (dto as AggregateSourceDto) : {};
  // We retrieve the metadata array if it's a wrapper, or directly if it's already unwrapped
  const nodes = normalizeMetadataNodes(source.metadata);
  const extractor = new MetadataExtractor(nodes);
  const dataApertura = extractor.getString('DataApertura', 'N/D');

  // Subjects Extraction specifically for Aggregations
  const ruoli = extractor.findAllValues('Ruolo') as unknown[];
  const soggetti = ruoli.map((roleNode) => {
    const rExtractor = new MetadataExtractor(normalizeMetadataNodes(roleNode));
    const fullName = `${rExtractor.getString('Nome', '')} ${rExtractor.getString('Cognome', '')}`.trim();

    return {
      tipoRuolo: rExtractor.getString('TipoRuolo', 'Sconosciuto'),
      denominazione: fullName.length > 0 ? fullName : rExtractor.getString('Denominazione', 'N/A'),
    };
  });

  const explicitCustomData = extractor.extractCustomDataPairs(['CustomMetadata', 'ArchimemoData']);
  const wildUnmappedData = extractor.extractGenericUnmappedCustomMetadata(
    KNOWN_AGGREGATE_XSD_ROOT_BLOCKS,
  );
  const mergedCustomMetadata = [...explicitCustomData, ...wildUnmappedData];

  return {
    idAgg: {
      tipoAggregazione: extractor.getString(
        'TipoAggregazione',
        'Fascicolo',
      ) as TipoAggregazioneEnum,
      idAggregazione: extractor.getString('IdAggregazione', String(source.id ?? '')),
    },
    tipologiaFascicolo: extractor.getString(
      'TipologiaFascicolo',
      'procedimento amministrativo',
    ) as TipologiaFascicoloEnum,
    soggetti: soggetti.length > 0 ? soggetti : [{ tipoRuolo: 'Sconosciuto', denominazione: 'N/A' }],
    assegnazione: {
      tipoAssegnazione: extractor.getString('TipoAssegnazione', 'Per competenza') as
        | 'Per competenza'
        | 'Per conoscenza',
      soggettoAssegnatario: {
        tipoRuolo: 'Assegnatario',
        denominazione: extractor.getString('Nome', 'N/A'),
      },
      dataInizioAssegnazione: extractor.getString('DataInizioAssegnazione', 'N/A'),
    },
    dataApertura,
    dataChiusura: extractor.getString('DataChiusura'), // optional
    classificazione: {
      indiceDiClassificazione: extractor.getString('IndiceDiClassificazione', 'N/A'),
      descrizione: extractor.getString('Descrizione', 'N/A'),
    },
    progressivo: extractor.getNumber('Progressivo', 1),
    chiaveDescrittiva: {
      oggetto: extractor.getString('Oggetto', `Fascicolo n. ${String(source.id ?? '')}`),
    },
    procedimentoAmministrativo: {
      materiaArgomentoStruttura: extractor.getString('MateriaArgomentoStruttura', 'Standard'),
      procedimento: extractor.getString('Procedimento', 'N/A'),
      uriProcedimento: extractor.getString('URIProcedimento', ''),
      fasi: [], // Fasi details can be recursively mapped similar to subjects
    },
    posizioneFisicaAggregazioneDocumentale: extractor.getString(
      'PosizioneFisicaAggregazioneDocumentale',
      'Archivio',
    ),
    tempoDiConservazione: extractor.getNumber('TempoDiConservazione', 10),

    processSummary: {
      uuid: String(source.uuid || 'N/D'),
      integrityStatus: String(source.integrityStatus || 'UNKNOWN'),
      timestamp: dataApertura || 'N/D',
    },

    // In a real payload we might find a block of <IndiceDocumenti>
    indiceDocumenti: [],

    customMetadata: mergedCustomMetadata,
  };
}
