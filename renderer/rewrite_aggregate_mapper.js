const fs = require('fs');

const fileContent = `import {
  AggregateDetailDTO,
  TipologiaFascicoloEnum,
  TipoAggregazioneEnum,
  SoggettoDTO,
  DocumentIndexEntryDTO
} from '../../../shared/domain/dto/AggregateDTO';
import { MetadataExtractor } from '../../../shared/utils/metadata-extractor.util';
import { normalizeMetadataNodes } from '../../../shared/utils/metadata-nodes.util';

interface AggregateSourceDto {
  id?: unknown;
  uuid?: unknown;
  integrityStatus?: unknown;
  metadata?: unknown;
}

function toSafeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
    ? String(value)
    : fallback;
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

function extractIpa(rExtractor: MetadataExtractor, field: string): string {
  const block = rExtractor.findValue(field);
  if (block && Array.isArray(block)) {
    return String(
      rExtractor.findValue('CodiceIPA', block) ||
        rExtractor.findValue('Denominazione', block) ||
        ''
    );
  }
  return rExtractor.getString(field, '');
}

function mapSubjects(extractor: MetadataExtractor): SoggettoDTO[] {
  const ruoli = extractor.findAllValues('Ruolo') as unknown[];
  if (!ruoli || ruoli.length === 0) return [{ tipoRuolo: 'Sconosciuto', denominazione: 'N/A' }];

  return ruoli.map((roleNode) => {
    const rExtractor = new MetadataExtractor(normalizeMetadataNodes(roleNode));
    let tipoRuolo = rExtractor.getString('TipoRuolo', 'Sconosciuto');
    let denominazione = '';
    let codiceFiscale = '';
    let indirizzoDigitale = '';

    const extractIndirizzi = () => {
      const indirizzi = rExtractor.findAllValues('IndirizziDigitaliDiRiferimento');
      if (indirizzi.length > 0) {
        indirizzoDigitale = indirizzi.join(', ');
      }
    };

    if (rExtractor.findValue('AmministrazioneTitolare') || rExtractor.findValue('AmministrazionePartecipante')) {
      tipoRuolo = rExtractor.getString('TipoRuolo', tipoRuolo);
      denominazione = rExtractor.getString('DenominazioneAmministrazione') || extractIpa(rExtractor, 'IPAAmm') || extractIpa(rExtractor, 'IPAAOO');
      extractIndirizzi();
    } else if (rExtractor.findValue('PF')) {
      tipoRuolo = rExtractor.getString('TipoRuolo', tipoRuolo);
      const nome = rExtractor.getString('Nome', '');
      const cognome = rExtractor.getString('Cognome', '');
      denominazione = \`\${nome} \${cognome}\`.trim();
      codiceFiscale = rExtractor.getString('CodiceFiscale');
      extractIndirizzi();
    } else if (rExtractor.findValue('PG')) {
      tipoRuolo = rExtractor.getString('TipoRuolo', tipoRuolo);
      denominazione = rExtractor.getString('DenominazioneOrganizzazione');
      codiceFiscale = rExtractor.getString('CodiceFiscale_PartitaIva') || rExtractor.getString('CodiceFiscale');
      extractIndirizzi();
    } else if (rExtractor.findValue('RUP')) {
      tipoRuolo = 'RUP';
      const nome = rExtractor.getString('Nome', '');
      const cognome = rExtractor.getString('Cognome', '');
      denominazione = \`\${nome} \${cognome}\`.trim() || rExtractor.getString('DenominazioneOrganizzazione');
      codiceFiscale = rExtractor.getString('CodiceFiscale');
      extractIndirizzi();
    } else if (rExtractor.findValue('AS') || rExtractor.findValue('Assegnatario')) {
      tipoRuolo = 'Assegnatario';
      const nome = rExtractor.getString('Nome', '');
      const cognome = rExtractor.getString('Cognome', '');
      denominazione = \`\${nome} \${cognome}\`.trim() || rExtractor.getString('DenominazioneOrganizzazione');
      codiceFiscale = rExtractor.getString('CodiceFiscale');
      extractIndirizzi();
    } else {
      const fullName = \`\${rExtractor.getString('Nome', '')} \${rExtractor.getString('Cognome', '')}\`.trim();
      denominazione = fullName.length > 0 ? fullName : rExtractor.getString('Denominazione', 'N/A');
    }

    return {
      tipoRuolo,
      denominazione: denominazione || 'N/A',
      codiceFiscale: codiceFiscale || undefined,
      indirizzoDigitale: indirizzoDigitale || undefined
    };
  });
}

function mapDocumentIndices(extractor: MetadataExtractor): DocumentIndexEntryDTO[] {
  const tipi = extractor.findAllValues('TipoDocumento') as unknown[];
  if (!tipi || tipi.length === 0) return [];
  
  return tipi.map((docNode) => {
    const dExtractor = new MetadataExtractor(normalizeMetadataNodes(docNode));
    let idValue = '';
    let impronta = '';
    let type: 'DocumentoAmministativoinformatico' | 'Documentoinformatico' | 'Documento' = 'Documento';

    if (dExtractor.findValue('DocumentoAmministrativoInformatico')) {
      type = 'DocumentoAmministativoinformatico';
      idValue = dExtractor.getString('Identificativo');
      impronta = dExtractor.getString('Impronta');
    } else if (dExtractor.findValue('DocumentoInformatico')) {
      type = 'Documentoinformatico';
      idValue = dExtractor.getString('Identificativo');
      impronta = dExtractor.getString('Impronta');
    } else {
      idValue = dExtractor.getString('Identificativo', 'N/A');
    }
    
    return {
      tipoDocumento: type,
      identificativo: idValue,
      impronta: impronta || undefined
    };
  });
}

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

  const explicitCustomData = extractor.extractCustomDataPairs(['CustomMetadata', 'ArchimemoData']);
  const wildUnmappedData = extractor.extractGenericUnmappedCustomMetadata(
    KNOWN_AGGREGATE_XSD_ROOT_BLOCKS,
  );
  const mergedCustomMetadata = [...explicitCustomData, ...wildUnmappedData];
  const rawFasi = extractor.findAllValues('Fase') as unknown[];
  const fasi = rawFasi.map((faseNode) => {
    const faseExtractor = new MetadataExtractor(normalizeMetadataNodes(faseNode));
    return {
      tipoFase: faseExtractor.getString('Fase', faseExtractor.getString('TipoFase', 'Preparatoria')) as any,
      dataInizio: faseExtractor.getString('DataInizioFase', faseExtractor.getString('DataInizio', 'N/A')),
      dataFine: faseExtractor.getString('DataFineFase', faseExtractor.getString('DataFine', '')),
    };
  });

  return {
    idAgg: {
      tipoAggregazione: extractor.getString(
        'TipoAggregazione',
        'Fascicolo',
      ) as TipoAggregazioneEnum,
      idAggregazione: extractor.getString('IdAggregazione', toSafeString(source.id, '')),
    },
    tipologiaFascicolo: extractor.getString(
      'TipologiaFascicolo',
      'procedimento amministrativo',
    ) as TipologiaFascicoloEnum,
    soggetti: mapSubjects(extractor),
    assegnazione: {
      tipoAssegnazione: extractor.getString('TipoAssegnazioneRuolo', extractor.getString('TipoAssegnazione', 'Per competenza')) as
        | 'Per competenza'
        | 'Per conoscenza',
      soggettoAssegnatario: {
        tipoRuolo: 'Assegnatario',
        denominazione: extractor.getString('Nome') && extractor.getString('Cognome') 
          ? \`\${extractor.getString('Nome')} \${extractor.getString('Cognome')}\`
          : extractor.getString('DenominazioneOrganizzazione', 'N/A'),
        codiceFiscale: extractor.getString('CodiceFiscale')
      },
      dataInizioAssegnazione: extractor.getString('DataInizioAssegnazione', 'N/A'),
      dataFineAssegnazione: extractor.getString('DataFineAssegnazione'),
    },
    dataApertura,
    dataChiusura: extractor.getString('DataChiusura'), // optional
    classificazione: {
      indiceDiClassificazione: extractor.getString('IndiceDiClassificazione', 'N/A'),
      descrizione: extractor.getString('Descrizione', 'N/A'),
      pianoDiClassificazione: extractor.getString('PianoDiClassificazione')
    },
    progressivo: extractor.getNumber('Progressivo', 1),
    chiaveDescrittiva: {
      oggetto: extractor.getString('Oggetto', \`Fascicolo n. \${toSafeString(source.id, '')}\`),
      paroleChiave: extractor.getString('ParoleChiave')
    },
    procedimentoAmministrativo: {
      materiaArgomentoStruttura: extractor.getString('MateriaArgomentoStruttura', 'Standard'),
      procedimento: extractor.getString('Procedimento', 'N/A'),
      uriProcedimento: extractor.getString('CatalogoProcedimenti', extractor.getString('URIProcedimento', '')),
      fasi,
    },
    idAggPrimario: extractor.getString('IdAggregazione', undefined, extractor.findValue('IdAggPrimario')),
    posizioneFisicaAggregazioneDocumentale: extractor.getString(
      'PosizioneFisicaAggregazioneDocumentale',
      'Archivio',
    ),
    tempoDiConservazione: extractor.getNumber('TempoDiConservazione', 10),
    note: extractor.getString('Note'),

    processSummary: {
      uuid: toSafeString(source.uuid, 'N/D'),
      integrityStatus: toSafeString(source.integrityStatus, 'UNKNOWN'),
      timestamp: dataApertura || 'N/D',
    },

    indiceDocumenti: mapDocumentIndices(extractor),

    customMetadata: mergedCustomMetadata,
  };
}
`;

fs.writeFileSync('src/app/features/aggregate/mappers/aggregate.mapper.ts', fileContent);
