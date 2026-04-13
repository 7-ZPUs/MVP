import {
  DocumentDetail,
  DocumentMetadata,
  ClassificationInfo,
  FormatInfo,
  VerificationInfo,
  AttachmentData,
  ChangeTrackingData,
  RegistrationData,
  MimeType,
  Subject,
  SubjectType,
} from '../domain/document.models';
import { MetadataExtractor } from '../../../shared/utils/metadata-extractor.util';
import { normalizeDisplayFileName } from '../../../shared/utils/display-file-name.util';
import { normalizeMetadataNodes } from '../../../shared/utils/metadata-nodes.util';

interface DocumentSourceDto {
  id?: unknown;
  uuid?: unknown;
  integrityStatus?: unknown;
  metadata?: unknown;
}

// List of all expected parent XML blocks that we already parse manually
const KNOWN_DOCUMENT_XSD_ROOT_BLOCKS = new Set<string>([
  'IdDoc',
  'ModalitaDiFormazione',
  'TipologiaDocumentale',
  'DatiDiRegistrazione',
  'Soggetti',
  'ChiaveDescrittiva',
  'Allegati',
  'Classificazione',
  'Riservato',
  'IdentificativoDelFormato',
  'Verifica',
  'Verificazioni',
  'Agg',
  'IdIdentificativoDocumentoPrimario',
  'NomeDelDocumento',
  'VersioneDelDocumento',
  'TracciatureModificheDocumento',
  'TempoDiConservazione',
  'Note',
  // We can choose to manually skip CustomMetadata wrappers from generic extraction
  // so we process them via extractCustomDataPairs instead. Or we can just let
  // generic extraction handle them! We'll just let generic handle EVERYTHING unmapped.
  'CustomMetadata',
  'ArchimemoData',
]);

/**
 * Helper to infer mime type from a metadata string or a file extension.
 */
function inferMimeType(mimeStr?: string, ext?: string): MimeType {
  for (const val of [mimeStr, ext]) {
    if (!val) continue;
    const lowerVal = val.toLowerCase();
    if (lowerVal.includes('pdf') || lowerVal === 'pdf') return MimeType.PDF;
    if (
      lowerVal.includes('image') ||
      ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(lowerVal)
    )
      return MimeType.IMAGE;
    if (lowerVal.includes('text') || ['txt', 'csv', 'md'].includes(lowerVal)) return MimeType.TEXT;
    if (lowerVal.includes('xml') || lowerVal === 'xml') return MimeType.XML;
  }
  return MimeType.UNSUPPORTED;
}

/**
 * Maps the core identity details of the document.
 */
function mapIdentityAndMimeType(
  dto: DocumentSourceDto,
  extractor: MetadataExtractor,
): { id: string; fileName: string; mimeType: MimeType; uuid: string } {
  // ID and UUID can be found in the metadata or fallback to DTO properties
  const rootIdDoc = extractor.findValue('IdDoc');
  const rootIdent =
    rootIdDoc && Array.isArray(rootIdDoc)
      ? extractor.findValue('Identificativo', rootIdDoc)
      : undefined;

  const rawIdFromMeta =
    extractor.getString('id') ||
    (rootIdent ? String(rootIdent) : '') ||
    extractor.getString('Identificativo');
  const rawIdFromDto = String(dto.id ?? '').trim();
  // Prefer the persisted DTO id (DB identity) for app flows like preview/export.
  // Domain/business identifiers from metadata are still exposed in metadata.identificativo.
  const rawId = rawIdFromDto || String(rawIdFromMeta ?? '').trim();
  const rawUuid = String((extractor.getString('uuid') || dto.uuid) ?? '').trim();

  const fallbackFileName = rawId.length > 0 ? `Documento ${rawId}` : 'Documento';
  const extractedFileName = extractor.getString('NomeDelDocumento', fallbackFileName);
  const fileName = normalizeDisplayFileName(extractedFileName) || fallbackFileName;

  const mimeTypeFromMeta = extractor.getString('mimetype') ?? extractor.getString('mimeType');
  const ext = fileName.split('.').pop();
  const mimeType = inferMimeType(mimeTypeFromMeta, ext);

  return {
    id: rawId,
    fileName,
    mimeType,
    uuid: rawUuid,
  };
}

/**
 * Maps general descriptive metadata (including Note and TempoDiConservazione if added later).
 */
function mapBaseMetadata(extractor: MetadataExtractor): DocumentMetadata {
  const metaIdDoc = extractor.findValue('IdDoc');
  const idNodes = Array.isArray(metaIdDoc) ? metaIdDoc : [];
  const identificativo =
    extractor.findValue('Identificativo', idNodes) || extractor.getString('Identificativo', 'N/A');

  const improntaCrittografica = extractor.findValue('ImprontaCrittograficaDelDocumento', idNodes);
  const improntaNodes = Array.isArray(improntaCrittografica) ? improntaCrittografica : idNodes;
  const impronta =
    extractor.findValue('Impronta', improntaNodes) || extractor.getString('Impronta', 'N/A');
  const algoritmoImpronta =
    extractor.findValue('Algoritmo', improntaNodes) || extractor.getString('Algoritmo', 'SHA-256');

  const idPrimarioBlock = extractor.findValue('IdIdentificativoDocumentoPrimario');
  const idPrimarioNodes = Array.isArray(idPrimarioBlock) ? idPrimarioBlock : [];
  const idPrimario =
    extractor.findValue('Identificativo', idPrimarioNodes) ||
    extractor.getString('IdIdentificativoDocumentoPrimario');

  return {
    identificativo: String(identificativo),
    impronta: String(impronta),
    algoritmoImpronta: String(algoritmoImpronta),
    nome: extractor.getString('NomeDelDocumento'),
    descrizione: extractor.getString('Note'),
    oggetto: extractor.getString('Oggetto'),
    paroleChiave: extractor.findAllValues('ParoleChiave').map((v) => String(v)),
    tipoDocumentale: extractor.getString('TipologiaDocumentale', 'Generico'),
    modalitaFormazione: extractor.getString('ModalitaDiFormazione', 'Generica'),
    riservatezza: extractor.getString('Riservato', 'false'),
    versione: extractor.getString('VersioneDelDocumento', '1'),
    note: extractor.getString('Note'),
    tempoDiConservazione: extractor.getString('TempoDiConservazione'),
    idIdentificativoDocumentoPrimario:
      idPrimario && typeof idPrimario !== 'object' ? String(idPrimario) : undefined,
  };
}

/**
 * Maps classification data.
 */
function mapClassification(extractor: MetadataExtractor): ClassificationInfo {
  return {
    indice: extractor.getString('IndiceDiClassificazione', 'N/A'),
    descrizione: extractor.getString('Descrizione', 'N/A'),
    uriPiano: extractor.getString('PianoDiClassificazione', 'N/A'),
  };
}

function parseTipoRegistro(rawTipo: unknown, extractor: MetadataExtractor): string {
  let tipoRegistro = 'N/A';

  if (typeof rawTipo === 'string') {
    tipoRegistro = rawTipo;
  } else if (Array.isArray(rawTipo)) {
    const innerNode = rawTipo.find((n) => n.name === 'TipoRegistro' || typeof n.value === 'string');
    if (innerNode && typeof innerNode.value === 'string') {
      tipoRegistro = innerNode.value;
    } else {
      const firstObj = rawTipo[0];
      if (firstObj && Array.isArray(firstObj.value)) {
        const nestedNode = firstObj.value.find(
          (n: { name?: string; value?: unknown }) => n.name === 'TipoRegistro',
        );
        tipoRegistro =
          nestedNode && typeof nestedNode.value === 'string'
            ? nestedNode.value
            : firstObj.name || 'N/A';
      }
    }
  } else if (rawTipo && typeof rawTipo === 'object') {
    if ('TipoRegistro' in rawTipo) {
      tipoRegistro = String((rawTipo as Record<string, unknown>)['TipoRegistro']);
    } else {
      const keys = Object.keys(rawTipo).filter((k) => k !== '_' && k !== '$');
      if (keys.length > 0) tipoRegistro = keys[0];
    }
  }

  if (tipoRegistro === '[object Object]' || tipoRegistro.includes('[object Object]')) {
    tipoRegistro = 'Registro';
  }

  // Handle TipoRegistro from Repertorio_Registro explicitly if missing
  if (tipoRegistro === 'N/A') {
    const repReg = extractor.findValue('Repertorio_Registro');
    if (Array.isArray(repReg)) {
      const trNode = repReg.find((n) => n.name === 'TipoRegistro');
      if (trNode && typeof trNode.value === 'string') tipoRegistro = trNode.value;
    } else {
      const strRepReg = extractor.getString('Repertorio_Registro', '');
      if (strRepReg && !strRepReg.includes('[object Object]')) tipoRegistro = strRepReg;
    }
  }

  return tipoRegistro;
}

/**
 * Maps registration data.
 */
function mapRegistration(extractor: MetadataExtractor): RegistrationData {
  const tipoRegistro = parseTipoRegistro(extractor.findValue('TipoRegistro'), extractor);

  return {
    flusso: extractor.getString('TipologiaDiFlusso', 'N/A'),
    tipoRegistro,
    data:
      extractor.getString('DataRegistrazioneDocumento', '') ||
      extractor.getString('DataProtocollazioneDocumento', '') ||
      extractor.getString('DataDocumento', 'N/A'),
    ora:
      extractor.getString('OraRegistrazioneDocumento', '') ||
      extractor.getString('OraProtocollazioneDocumento', '') ||
      extractor.getString('OraDocumento', undefined),
    numero:
      extractor.getString('NumeroRegistrazioneDocumento', '') ||
      extractor.getString('NumeroProtocolloDocumento', '') ||
      extractor.getString('NumeroDocumento', 'N/A'),
    codice: extractor.getString('CodiceRegistro', 'N/A'),
  };
}

/**
 * Maps format and integrity info.
 */
function mapFormatInfo(extractor: MetadataExtractor): FormatInfo {
  return {
    tipo: extractor.getString('Formato', 'N/A'),
    prodotto: extractor.getString('NomeProdotto', 'N/A'),
    versione: extractor.getString('VersioneProdotto', 'N/A'),
    produttore: extractor.getString('Produttore', 'N/A'),
  };
}

/**
 * Maps verification and digital signature fields.
 */
function mapVerification(extractor: MetadataExtractor): VerificationInfo {
  return {
    firmaDigitale: extractor.getString('FirmatoDigitalmente', 'N/A'),
    sigillo: extractor.getString('SigillatoElettronicamente', 'N/A'),
    marcaturaTemporale: extractor.getString('MarcaturaTemporale', 'N/A'),
    conformitaCopie: extractor.getString('ConformitaCopieImmagineSuSupportoInformatico', 'N/A'),
  };
}

/**
 * Maps attachments blocks.
 */
function mapAttachments(extractor: MetadataExtractor): AttachmentData {
  const numeroAllegati = extractor.getNumber('NumeroAllegati', 0);
  const indiciAllegati = extractor.findAllValues('IndiceAllegati') as unknown[];
  const allegatiList = indiciAllegati.map((attachmentNode) => {
    const nodeArray = Array.isArray(attachmentNode) ? attachmentNode : [attachmentNode];
    const ident = extractor.findValue('Identificativo', nodeArray) || '';
    const descr = extractor.findValue('Descrizione', nodeArray) || '';
    const displayIdentifier = normalizeDisplayFileName(String(ident)) || String(ident);
    return { id: displayIdentifier, descrizione: String(descr) };
  });

  return {
    numero: numeroAllegati,
    allegati: allegatiList,
  };
}

function extractIpaFields(rExtractor: MetadataExtractor, campiSpecifici: Record<string, string>) {
  const extractIpa = (field: string) => {
    const block = rExtractor.findValue(field);
    if (block && Array.isArray(block)) {
      return String(
        rExtractor.findValue('CodiceIPA', block) ||
          rExtractor.findValue('Denominazione', block) ||
          '',
      );
    }
    return rExtractor.getString(field, '');
  };
  ['IPAAmm', 'IPAAOO', 'IPAUOR'].forEach((field) => {
    if (rExtractor.findValue(field)) {
      const val = extractIpa(field);
      if (val && !val.includes('[object Object]')) campiSpecifici[field] = val;
    }
  });
}

function extractIndirizzi(rExtractor: MetadataExtractor, campiSpecifici: Record<string, string>) {
  const indirizzi = rExtractor.findAllValues('IndirizziDigitaliDiRiferimento');
  if (indirizzi.length > 0) {
    campiSpecifici['IndirizziDigitaliDiRiferimento'] = indirizzi.join(', ');
  }
}

function parseSubjectDetails(rExtractor: MetadataExtractor): {
  tipo: SubjectType;
  campiSpecifici: Record<string, string>;
} {
  const campiSpecifici: Record<string, string> = {};

  if (rExtractor.findValue('PF') !== undefined) {
    campiSpecifici['Nome'] = rExtractor.getString('Nome');
    campiSpecifici['Cognome'] = rExtractor.getString('Cognome');
    if (rExtractor.findValue('CodiceFiscale') !== undefined)
      campiSpecifici['CodiceFiscale'] = rExtractor.getString('CodiceFiscale');
    extractIndirizzi(rExtractor, campiSpecifici);
    return { tipo: SubjectType.PF, campiSpecifici };
  }
  if (rExtractor.findValue('PG') !== undefined) {
    campiSpecifici['DenominazioneOrganizzazione'] = rExtractor.getString(
      'DenominazioneOrganizzazione',
    );
    if (rExtractor.findValue('CodiceFiscale_PartitaIva') !== undefined)
      campiSpecifici['CodiceFiscale_PartitaIva'] = rExtractor.getString('CodiceFiscale_PartitaIva');
    if (rExtractor.findValue('DenominazioneUfficio') !== undefined)
      campiSpecifici['DenominazioneUfficio'] = rExtractor.getString('DenominazioneUfficio');
    extractIndirizzi(rExtractor, campiSpecifici);
    return { tipo: SubjectType.PG, campiSpecifici };
  }
  if (rExtractor.findValue('PAI') !== undefined) {
    extractIpaFields(rExtractor, campiSpecifici);
    extractIndirizzi(rExtractor, campiSpecifici);
    return { tipo: SubjectType.PAI, campiSpecifici };
  }
  if (rExtractor.findValue('PAE') !== undefined) {
    campiSpecifici['DenominazioneAmministrazione'] = rExtractor.getString(
      'DenominazioneAmministrazione',
    );
    if (rExtractor.findValue('DenominazioneUfficio') !== undefined)
      campiSpecifici['DenominazioneUfficio'] = rExtractor.getString('DenominazioneUfficio');
    extractIndirizzi(rExtractor, campiSpecifici);
    return { tipo: SubjectType.PAE, campiSpecifici };
  }
  if (
    rExtractor.findValue('AS') !== undefined ||
    rExtractor.findValue('Assegnatario') !== undefined
  ) {
    if (rExtractor.findValue('Nome') !== undefined)
      campiSpecifici['Nome'] = rExtractor.getString('Nome');
    if (rExtractor.findValue('Cognome') !== undefined)
      campiSpecifici['Cognome'] = rExtractor.getString('Cognome');
    if (rExtractor.findValue('CodiceFiscale') !== undefined)
      campiSpecifici['CodiceFiscale'] = rExtractor.getString('CodiceFiscale');
    if (rExtractor.findValue('DenominazioneOrganizzazione') !== undefined)
      campiSpecifici['DenominazioneOrganizzazione'] = rExtractor.getString(
        'DenominazioneOrganizzazione',
      );
    if (rExtractor.findValue('DenominazioneUfficio') !== undefined)
      campiSpecifici['DenominazioneUfficio'] = rExtractor.getString('DenominazioneUfficio');
    extractIpaFields(rExtractor, campiSpecifici);
    extractIndirizzi(rExtractor, campiSpecifici);
    return { tipo: SubjectType.AS, campiSpecifici };
  }
  if (rExtractor.findValue('SW') !== undefined) {
    campiSpecifici['DenominazioneSistema'] = rExtractor.getString('DenominazioneSistema');
    return { tipo: SubjectType.SW, campiSpecifici };
  }
  if (rExtractor.findValue('RUP') !== undefined) {
    if (rExtractor.findValue('Nome') !== undefined)
      campiSpecifici['Nome'] = rExtractor.getString('Nome');
    if (rExtractor.findValue('Cognome') !== undefined)
      campiSpecifici['Cognome'] = rExtractor.getString('Cognome');
    if (rExtractor.findValue('CodiceFiscale') !== undefined)
      campiSpecifici['CodiceFiscale'] = rExtractor.getString('CodiceFiscale');
    extractIpaFields(rExtractor, campiSpecifici);
    extractIndirizzi(rExtractor, campiSpecifici);
    return { tipo: SubjectType.PF, campiSpecifici };
  }

  return { tipo: SubjectType.PG, campiSpecifici }; // Fallback
}

/**
 * Maps Subjects based on XSD.
 */
function mapSubjects(extractor: MetadataExtractor): Subject[] {
  const ruoli = extractor.findAllValues('Ruolo') as unknown[];
  if (!ruoli || ruoli.length === 0) return [];

  return ruoli.map((ruoloNode) => {
    const rExtractor = new MetadataExtractor(normalizeMetadataNodes(ruoloNode));
    const tipoRuolo = rExtractor.getString('TipoRuolo', 'Sconosciuto');
    const { tipo, campiSpecifici } = parseSubjectDetails(rExtractor);

    return {
      ruolo: tipoRuolo,
      tipo: tipo,
      campiSpecifici,
    };
  });
}

function parseChangeTrackingSoggetto(extractor: MetadataExtractor): string {
  let soggetto = extractor.getString('Soggetto', 'N/A');
  const autoreBlock = extractor.findValue('SoggettoAutoreDellaModifica');
  if (autoreBlock && Array.isArray(autoreBlock)) {
    const descr =
      `${extractor.findValue('Nome', autoreBlock) || ''} ${extractor.findValue('Cognome', autoreBlock) || ''}`.trim();
    if (descr) soggetto = descr;
  }
  if (!soggetto || soggetto === 'N/A' || String(soggetto).includes('[object Object]')) {
    const fallbackSoggetto = extractor.getString('SoggettoAutoreDellaModifica', 'N/A');
    soggetto = String(fallbackSoggetto).includes('[object Object]')
      ? 'Autore Sconosciuto'
      : fallbackSoggetto;
  }
  return soggetto;
}

function parseChangeTrackingPrecedente(extractor: MetadataExtractor): string {
  const idPrevBlock = extractor.findValue('IdDocVersionePrecedente');
  let idPrev = extractor.getString('IdentificativoVersionePrecedente', '');
  if (idPrevBlock && Array.isArray(idPrevBlock)) {
    idPrev = String(extractor.findValue('Identificativo', idPrevBlock) || idPrev);
  } else if (!idPrev) {
    idPrev = extractor.getString('IdDocVersionePrecedente', '');
  }
  return String(idPrev).includes('[object Object]') ? '' : idPrev;
}

/**
 * Maps change tracking (TracciatureModificheDocumento).
 */
function mapChangeTracking(extractor: MetadataExtractor): ChangeTrackingData {
  return {
    tipo: extractor.getString('TipoModifica', 'N/A'),
    soggetto: parseChangeTrackingSoggetto(extractor),
    data: extractor.getString('DataModifica', 'N/A'),
    ora: extractor.getString('OraModifica', undefined),
    idVersionePrecedente: parseChangeTrackingPrecedente(extractor),
  };
}

/**
 * Defines the main mapping entry point.
 */
export function mapDocumentDtoToDetail(dto: unknown): DocumentDetail {
  const source: DocumentSourceDto =
    dto && typeof dto === 'object' ? (dto as DocumentSourceDto) : {};
  const nodes = normalizeMetadataNodes(source.metadata);
  const extractor = new MetadataExtractor(nodes);
  const identity = mapIdentityAndMimeType(source, extractor);

  // We bring in both formally packed custom pairs + all randomly unmapped external nodes
  const explicitCustomData = extractor.extractCustomDataPairs(['CustomMetadata', 'ArchimemoData']);
  const wildUnmappedData = extractor.extractGenericUnmappedCustomMetadata(
    KNOWN_DOCUMENT_XSD_ROOT_BLOCKS,
  );

  // Merge the arrays
  const mergedCustomMetadata = [...explicitCustomData, ...wildUnmappedData];

  return {
    documentId: identity.id,
    fileName: identity.fileName,
    mimeType: identity.mimeType,
    metadata: mapBaseMetadata(extractor),
    classification: mapClassification(extractor),
    registration: mapRegistration(extractor),
    format: mapFormatInfo(extractor),
    verification: mapVerification(extractor),
    attachments: mapAttachments(extractor),
    changeTracking: mapChangeTracking(extractor),
    subjects: mapSubjects(extractor),
    aggregation: {
      tipoAggregazione: extractor.getString('TipoAggregazione'),
      idAggregazione: extractor.getString('IdAggregazione') || extractor.getString('IdAgg'),
    },
    aipInfo: {
      classeDocumentale: extractor.getString('ClasseDocumentale', 'N/A'),
      uuid: identity.uuid || 'N/A',
      conservationProcess: extractor.getString('PreservationProcessUUID', 'N/A'),
      conservationSession: extractor.getString('Sessione', 'N/A'),
      conservationStartDate: extractor.getString('PreservationProcessDate', 'N/A'),
    },
    customMetadata: mergedCustomMetadata,
    integrityStatus: source.integrityStatus ? String(source.integrityStatus) : undefined,
  };
}
