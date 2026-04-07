import {
  DocumentDetail,
  DocumentMetadata,
  ClassificationInfo,
  FormatInfo,
  VerificationInfo,
  AttachmentData,
  ChangeTrackingData,
  AipInfo,
  ConservationProcessData,
  RegistrationData,
  MimeType,
  Subject,
  SubjectType,
} from '../domain/document.models';
import { DocumentDTO } from '../../../shared/domain/dto/indexDTO';
import { MetadataExtractor } from '../../../shared/utils/metadata-extractor.util';
import { normalizeDisplayFileName } from '../../../shared/utils/display-file-name.util';

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
  dto: DocumentDTO,
  extractor: MetadataExtractor,
): { id: string; fileName: string; mimeType: MimeType } {
  const extractedFileName = extractor.getString('NomeDelDocumento', `Documento ${dto.id}`);
  const fileName = normalizeDisplayFileName(extractedFileName) || `Documento ${dto.id}`;
  let mimeType = MimeType.UNSUPPORTED;

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

  return {
    id: String(dto.id),
    fileName,
    mimeType,
  };
}

/**
 * Maps general descriptive metadata (including Note and TempoDiConservazione if added later).
 */
function mapBaseMetadata(extractor: MetadataExtractor): DocumentMetadata {
  return {
    nome: extractor.getString('NomeDelDocumento'),
    descrizione: extractor.getString('Note'),
    oggetto: extractor.getString('Oggetto'),
    paroleChiave: extractor.findAllValues('ParoleChiave').map((v) => String(v)),
    tipoDocumentale: extractor.getString('TipologiaDocumentale', 'Generico'),
    modalitaFormazione: extractor.getString('ModalitaDiFormazione', 'Generica'),
    riservatezza: extractor.getString('Riservato', 'false'),
    versione: extractor.getString('VersioneDelDocumento', '1'),
    note: extractor.getString('Note'),
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
  return {
    flusso: extractor.getString('TipologiaDiFlusso', 'N/A'),
    tipoRegistro:
      extractor.getString('Repertorio_Registro', '') || extractor.getString('TipoRegistro', 'N/A'),
    data:
      extractor.getString('DataRegistrazioneDocumento', '') ||
      extractor.getString('DataProtocollazioneDocumento', 'N/A'),
    numero:
      extractor.getString('NumeroRegistrazioneDocumento', '') ||
      extractor.getString('NumeroProtocolloDocumento', 'N/A'),
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
    versione: extractor.getString('Versione', 'N/A'),
    produttore: extractor.getString('Produttore', 'N/A'),
    algoritmoImpronta: extractor.getString('Algoritmo', 'SHA-256'),
    impronta: extractor.getString('Impronta', 'N/A'),
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
  const indiciAllegati = extractor.findAllValues('IndiceAllegati');
  const allegatiList = indiciAllegati.map((i: any) => {
    const ident = extractor.findValue('Identificativo', Array.isArray(i) ? i : [i]) || '';
    const descr = extractor.findValue('Descrizione', Array.isArray(i) ? i : [i]) || '';
    const displayIdentifier = normalizeDisplayFileName(String(ident)) || String(ident);
    return { id: displayIdentifier, descrizione: String(descr) };
  });

  return {
    numero: numeroAllegati,
    allegati: allegatiList,
  };
}

/**
 * Maps preservation tracking info.
 */
function mapConservationProcess(extractor: MetadataExtractor): ConservationProcessData {
  return {
    processo: extractor.getString('PreservationProcessUUID', 'N/A'),
    sessione: 'N/A',
    dataInizio: extractor.getString('PreservationProcessDate', 'N/A'),
  };
}

/**
 * Maps Subjects based on XSD.
 */
function mapSubjects(extractor: MetadataExtractor): Subject[] {
  const ruoli = extractor.findAllValues('Ruolo');
  if (!ruoli || ruoli.length === 0) return [];

  return ruoli.map((ruoloNode: any) => {
    const rExtractor = new MetadataExtractor(Array.isArray(ruoloNode) ? ruoloNode : [ruoloNode]);
    const tipoRuolo = rExtractor.getString('TipoRuolo', 'Sconosciuto');

    // Tentativo di inferire il tipo in base ai tag XSD (PF, PG, PAI, PAE, SW, AS)
    let tipo: SubjectType = SubjectType.PAI;
    const campiSpecifici: Record<string, string> = {};

    if (rExtractor.findValue('PF')) {
      tipo = SubjectType.PF;
      campiSpecifici['Nome'] = rExtractor.getString('Nome');
      campiSpecifici['Cognome'] = rExtractor.getString('Cognome');
      campiSpecifici['CodiceFiscale'] = rExtractor.getString('CodiceFiscale');
    } else if (rExtractor.findValue('PG')) {
      tipo = SubjectType.PG;
      campiSpecifici['DenominazioneOrganizzazione'] = rExtractor.getString(
        'DenominazioneOrganizzazione',
      );
      campiSpecifici['CodiceFiscale_PartitaIva'] = rExtractor.getString('CodiceFiscale_PartitaIva');
    } else if (rExtractor.findValue('PAI')) {
      tipo = SubjectType.PAI;
      campiSpecifici['IPAAmm'] = rExtractor.getString('IPAAmm');
    } else if (rExtractor.findValue('AS') || rExtractor.findValue('Assegnatario')) {
      tipo = SubjectType.AS;
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
  return {
    tipo: extractor.getString('TipoModifica', 'N/A'),
    soggetto: extractor.getString('Soggetto', 'N/A'),
    data: extractor.getString('DataModifica', 'N/A'),
    idVersionePrecedente: extractor.getString('IdentificativoVersionePrecedente', ''),
  };
}

/**
 * Defines the main mapping entry point.
 */
export function mapDocumentDtoToDetail(dto: any): DocumentDetail {
  const nodes = Array.isArray(dto.metadata) ? dto.metadata : dto.metadata?.value || [];
  const extractor = new MetadataExtractor(nodes);
  const identity = mapIdentityAndMimeType(dto, extractor);

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
    conservationProcess: mapConservationProcess(extractor),
    changeTracking: mapChangeTracking(extractor),
    subjects: mapSubjects(extractor),
    idAggregazione: extractor.getString('IdAggregazione') || extractor.getString('IdAgg'),
    aipInfo: {
      classeDocumentale: extractor.getString('ClasseDocumentale', 'N/A'),
      uuid: dto.uuid || 'N/A',
    },
    customMetadata: mergedCustomMetadata,
    integrityStatus: dto.integrityStatus,
  };
}
