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
  const rawId = String((rawIdFromMeta || dto.id) ?? '').trim();
  const rawUuid = String((extractor.getString('uuid') || dto.uuid) ?? '').trim();

  const fallbackFileName = rawId.length > 0 ? `Documento ${rawId}` : 'Documento';
  const extractedFileName = extractor.getString('NomeDelDocumento', fallbackFileName);
  const fileName = normalizeDisplayFileName(extractedFileName) || fallbackFileName;

  // Mimetype can be found in metadata or fallback to file extension
  let mimeType = MimeType.UNSUPPORTED;
  const mimeTypeFromMeta = extractor.getString('mimetype') ?? extractor.getString('mimeType');

  if (mimeTypeFromMeta) {
    if (mimeTypeFromMeta.toLowerCase().includes('pdf')) mimeType = MimeType.PDF;
    else if (mimeTypeFromMeta.toLowerCase().includes('image')) mimeType = MimeType.IMAGE;
    else if (mimeTypeFromMeta.toLowerCase().includes('text')) mimeType = MimeType.TEXT;
    else if (mimeTypeFromMeta.toLowerCase().includes('xml')) mimeType = MimeType.XML;
  } else {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext) {
      if (['pdf'].includes(ext)) {
        mimeType = MimeType.PDF;
      } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) {
        mimeType = MimeType.IMAGE;
      } else if (['txt', 'csv', 'md'].includes(ext)) {
        mimeType = MimeType.TEXT;
      } else if (['xml'].includes(ext)) {
        mimeType = MimeType.XML;
      }
    }
  }

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

/**
 * Maps registration data.
 */
function mapRegistration(extractor: MetadataExtractor): RegistrationData {
  // If TipoRegistro is wrapped in an object or contains the exact value directly, we try to extract it from the inner property
  // or default to parsing the keys of the TipoRegistro object if it's complex.
  const rawTipo = extractor.findValue('TipoRegistro');
  let tipoRegistro = 'N/A';

  if (typeof rawTipo === 'string') {
    tipoRegistro = rawTipo;
  } else if (Array.isArray(rawTipo)) {
    // If it's an array of nodes, search inside it for the actual string value
    const innerNode = rawTipo.find((n) => n.name === 'TipoRegistro' || typeof n.value === 'string');
    if (innerNode && typeof innerNode.value === 'string') {
      tipoRegistro = innerNode.value;
    } else {
      // Fallback: check if the first node contains the real TipoRegistro
      const firstObj = rawTipo[0];
      if (firstObj && Array.isArray(firstObj.value)) {
        const nestedNode = firstObj.value.find((n: any) => n.name === 'TipoRegistro');
        if (nestedNode && typeof nestedNode.value === 'string') {
          tipoRegistro = nestedNode.value;
        } else {
          tipoRegistro = firstObj.name || 'N/A';
        }
      }
    }
  } else if (rawTipo && typeof rawTipo === 'object') {
    if ('TipoRegistro' in rawTipo) {
      tipoRegistro = String((rawTipo as any).TipoRegistro);
    } else {
      const keys = Object.keys(rawTipo).filter((k) => k !== '_' && k !== '$');
      if (keys.length > 0) {
        tipoRegistro = keys[0];
      }
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
      if (trNode && typeof trNode.value === 'string') {
        tipoRegistro = trNode.value;
      }
    } else {
      const strRepReg = extractor.getString('Repertorio_Registro', '');
      if (strRepReg && !strRepReg.includes('[object Object]')) {
        tipoRegistro = strRepReg;
      }
    }
  }

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

/**
 * Maps Subjects based on XSD.
 */
function mapSubjects(extractor: MetadataExtractor): Subject[] {
  const ruoli = extractor.findAllValues('Ruolo') as unknown[];
  if (!ruoli || ruoli.length === 0) return [];

  return ruoli.map((ruoloNode) => {
    const rExtractor = new MetadataExtractor(normalizeMetadataNodes(ruoloNode));
    const tipoRuolo = rExtractor.getString('TipoRuolo', 'Sconosciuto');

    // Tentativo di inferire il tipo in base ai tag XSD (PF, PG, PAI, PAE, SW, AS, RUP)
    let tipo: SubjectType = SubjectType.PAI;
    const campiSpecifici: Record<string, string> = {};

    const extractIndirizzi = () => {
      const indirizzi = rExtractor.findAllValues('IndirizziDigitaliDiRiferimento');
      if (indirizzi.length > 0) {
        campiSpecifici['IndirizziDigitaliDiRiferimento'] = indirizzi.join(', ');
      }
    };

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

    const setIpaFields = () => {
      if (rExtractor.findValue('IPAAmm')) {
        const val = extractIpa('IPAAmm');
        if (val && !val.includes('[object Object]')) campiSpecifici['IPAAmm'] = val;
      }
      if (rExtractor.findValue('IPAAOO')) {
        const val = extractIpa('IPAAOO');
        if (val && !val.includes('[object Object]')) campiSpecifici['IPAAOO'] = val;
      }
      if (rExtractor.findValue('IPAUOR')) {
        const val = extractIpa('IPAUOR');
        if (val && !val.includes('[object Object]')) campiSpecifici['IPAUOR'] = val;
      }
    };

    if (rExtractor.findValue('PF')) {
      tipo = SubjectType.PF;
      campiSpecifici['Nome'] = rExtractor.getString('Nome');
      campiSpecifici['Cognome'] = rExtractor.getString('Cognome');
      if (rExtractor.findValue('CodiceFiscale'))
        campiSpecifici['CodiceFiscale'] = rExtractor.getString('CodiceFiscale');
      extractIndirizzi();
    } else if (rExtractor.findValue('PG')) {
      tipo = SubjectType.PG;
      campiSpecifici['DenominazioneOrganizzazione'] = rExtractor.getString(
        'DenominazioneOrganizzazione',
      );
      if (rExtractor.findValue('CodiceFiscale_PartitaIva'))
        campiSpecifici['CodiceFiscale_PartitaIva'] = rExtractor.getString(
          'CodiceFiscale_PartitaIva',
        );
      if (rExtractor.findValue('DenominazioneUfficio'))
        campiSpecifici['DenominazioneUfficio'] = rExtractor.getString('DenominazioneUfficio');
      extractIndirizzi();
    } else if (rExtractor.findValue('PAI')) {
      tipo = SubjectType.PAI;
      setIpaFields();
      extractIndirizzi();
    } else if (rExtractor.findValue('PAE')) {
      tipo = SubjectType.PAE;
      campiSpecifici['DenominazioneAmministrazione'] = rExtractor.getString(
        'DenominazioneAmministrazione',
      );
      if (rExtractor.findValue('DenominazioneUfficio'))
        campiSpecifici['DenominazioneUfficio'] = rExtractor.getString('DenominazioneUfficio');
      extractIndirizzi();
    } else if (rExtractor.findValue('AS') || rExtractor.findValue('Assegnatario')) {
      tipo = SubjectType.AS;
      if (rExtractor.findValue('Nome')) campiSpecifici['Nome'] = rExtractor.getString('Nome');
      if (rExtractor.findValue('Cognome'))
        campiSpecifici['Cognome'] = rExtractor.getString('Cognome');
      if (rExtractor.findValue('CodiceFiscale'))
        campiSpecifici['CodiceFiscale'] = rExtractor.getString('CodiceFiscale');
      if (rExtractor.findValue('DenominazioneOrganizzazione'))
        campiSpecifici['DenominazioneOrganizzazione'] = rExtractor.getString(
          'DenominazioneOrganizzazione',
        );
      if (rExtractor.findValue('DenominazioneUfficio'))
        campiSpecifici['DenominazioneUfficio'] = rExtractor.getString('DenominazioneUfficio');
      setIpaFields();
      extractIndirizzi();
    } else if (rExtractor.findValue('SW')) {
      tipo = SubjectType.SW;
      campiSpecifici['DenominazioneSistema'] = rExtractor.getString('DenominazioneSistema');
    } else if (rExtractor.findValue('RUP')) {
      tipo = SubjectType.PF; // Mapped as Person
      if (rExtractor.findValue('Nome')) campiSpecifici['Nome'] = rExtractor.getString('Nome');
      if (rExtractor.findValue('Cognome'))
        campiSpecifici['Cognome'] = rExtractor.getString('Cognome');
      if (rExtractor.findValue('CodiceFiscale'))
        campiSpecifici['CodiceFiscale'] = rExtractor.getString('CodiceFiscale');
      setIpaFields();
      extractIndirizzi();
    } else {
      tipo = SubjectType.PG; // Fallback
    }

    return {
      ruolo: tipoRuolo,
      tipo: tipo,
      campiSpecifici,
    };
  });
}

/**
 * Maps change tracking (TracciatureModificheDocumento).
 */
function mapChangeTracking(extractor: MetadataExtractor): ChangeTrackingData {
  let soggetto = extractor.getString('Soggetto', 'N/A');
  const autoreBlock = extractor.findValue('SoggettoAutoreDellaModifica');
  if (autoreBlock && Array.isArray(autoreBlock)) {
    const nome = extractor.findValue('Nome', autoreBlock) || '';
    const cognome = extractor.findValue('Cognome', autoreBlock) || '';
    const descr = `${nome} ${cognome}`.trim();
    if (descr) soggetto = descr;
  }
  if (!soggetto || soggetto === 'N/A' || String(soggetto).includes('[object Object]')) {
    const fallbackSoggetto = extractor.getString('SoggettoAutoreDellaModifica', 'N/A');
    soggetto = String(fallbackSoggetto).includes('[object Object]')
      ? 'Autore Sconosciuto'
      : fallbackSoggetto;
  }

  const idPrevBlock = extractor.findValue('IdDocVersionePrecedente');
  let idPrev = extractor.getString('IdentificativoVersionePrecedente', '');
  if (idPrevBlock && Array.isArray(idPrevBlock)) {
    idPrev = String(extractor.findValue('Identificativo', idPrevBlock) || idPrev);
  } else if (!idPrev) {
    idPrev = extractor.getString('IdDocVersionePrecedente', '');
  }

  if (String(idPrev).includes('[object Object]')) {
    idPrev = '';
  }

  return {
    tipo: extractor.getString('TipoModifica', 'N/A'),
    soggetto: soggetto,
    data: extractor.getString('DataModifica', 'N/A'),
    ora: extractor.getString('OraModifica', undefined),
    idVersionePrecedente: idPrev,
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
    },
    customMetadata: mergedCustomMetadata,
    integrityStatus: source.integrityStatus ? String(source.integrityStatus) : undefined,
  };
}
