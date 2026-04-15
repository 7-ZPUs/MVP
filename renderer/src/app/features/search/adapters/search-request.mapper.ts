import {
  SearchConditionDTO,
  SearchFilters,
  SearchGroupDTO,
  SearchRequestDTO,
} from '../../../../../../shared/domain/metadata/search.models';
import {
  AggregationType,
  AssegnazioneType,
  DIDAIFormation,
  DocumentType,
  FascicoloType,
  ModificationType,
  ProcedimentoFaseType,
  RegisterType,
} from '../../../../../../shared/domain/metadata/search.enum';
import {
  SubjectRoleType,
  SubjectType,
} from '../../../../../../shared/domain/metadata/subject.enum';
import { SubjectCriteria } from '../../../../../../shared/domain/metadata/search-subject-filters-models';

type StringMode = 'LIKE' | 'EQ';

const DOC_ROOT = 'DocumentoInformatico';
const DOC_ADMIN_ROOT = 'DocumentoAmministrativoInformatico';
const AGG_ROOT = 'AggregazioneDocumentale';
const AGG_CUSTOM_META_ROOT = 'AggregazioneDocumentaliInformatiche';
const CUSTOM_METADATA_ROOTS = [DOC_ROOT, DOC_ADMIN_ROOT, AGG_CUSTOM_META_ROOT] as const;
const SUBJECT_ROOTS = [DOC_ROOT, DOC_ADMIN_ROOT, AGG_ROOT] as const;
const PATH_REGEX = /^\w+(\.\w+)*$/;

const SUBJECT_ROLE_WRAPPER: Record<string, string> = {
  [SubjectRoleType.ASSEGNATARIO]: 'Assegnatario',
  [SubjectRoleType.SOGGETTO_REGISTRAZIONE]: 'SoggettoCheEffettuaLaRegistrazione',
  [SubjectRoleType.MITTENTE]: 'Mittente',
  [SubjectRoleType.DESTINATARIO]: 'Destinatario',
  [SubjectRoleType.ALTRO]: 'Altro',
  [SubjectRoleType.AUTORE]: 'Autore',
  [SubjectRoleType.OPERATORE]: 'Operatore',
  [SubjectRoleType.RGD]: 'ResponsabileGestioneDocumentale',
  [SubjectRoleType.RSP]: 'ResponsabileServizioProtocollo',
};

const SUBJECT_ROLE_LABEL: Record<string, string> = {
  [SubjectRoleType.ASSEGNATARIO]: 'Assegnatario',
  [SubjectRoleType.SOGGETTO_REGISTRAZIONE]: 'Soggetto Che Effettua La Registrazione',
  [SubjectRoleType.MITTENTE]: 'Mittente',
  [SubjectRoleType.DESTINATARIO]: 'Destinatario',
  [SubjectRoleType.ALTRO]: 'Altro',
  [SubjectRoleType.AUTORE]: 'Autore',
  [SubjectRoleType.OPERATORE]: 'Operatore',
  [SubjectRoleType.RGD]: 'Responsabile della Gestione Documentale',
  [SubjectRoleType.RSP]: 'Responsabile del Servizio di Protocollo',
};

const SUBJECT_TYPE_WRAPPER: Record<string, string> = {
  [SubjectType.PAI]: 'PAI',
  [SubjectType.PAE]: 'PAE',
  [SubjectType.AS]: 'AS',
  [SubjectType.PG]: 'PG',
  [SubjectType.PF]: 'PF',
  [SubjectType.RUP]: 'RUP',
  [SubjectType.SW]: 'SW',
};

const REGISTER_TYPE_TO_XSD: Record<string, string> = {
  [RegisterType.PROTOCOLLO]: String.raw`ProtocolloOrdinario\ProtocolloEmergenza`,
  [RegisterType.REPERTORIO]: String.raw`Repertorio\Registro`,
  [RegisterType.NESSUNO]: 'Nessuno',
};

const DIDAI_FORMATION_TO_XSD: Record<string, string> = {
  [DIDAIFormation.EX_NOVO]:
    'creazione tramite utilizzo di strumenti software che assicurino la produzione di documenti nei formati previsti in allegato 2',
  [DIDAIFormation.ACQUISIZIONE]:
    'acquisizione di un documento informatico per via telematica o su supporto informatico, acquisizione della copia per immagine su supporto informatico di un documento analogico, acquisizione della copia informatica di un documento analogico',
  [DIDAIFormation.MEMORIZZAZIONE]:
    'memorizzazione su supporto informatico in formato digitale delle informazioni risultanti da transazioni o processi informatici o dalla presentazione telematica di dati attraverso moduli o formulari resi disponibili ad utente',
  [DIDAIFormation.GENERAZIONE]:
    'generazione o raggruppamento anche in via automatica di un insieme di dati o registrazioni, provenienti da una o più banche dati, anche appartenenti a più soggetti interoperanti, secondo una struttura logica predeterminata e memorizzata in forma statica',
};

const AGGREGATION_TYPE_TO_XSD: Record<string, string> = {
  [AggregationType.FASCICOLO]: 'Fascicolo',
  [AggregationType.SERIE_DOCUMENTALE]: 'Serie Documentale',
  [AggregationType.SERIE_FASCICOLI]: 'Serie Di Fascicoli',
};

const FASCICOLO_TYPE_TO_XSD: Record<string, string> = {
  [FascicoloType.AFFARE]: 'affare',
  [FascicoloType.ATTIVITA]: 'attivita',
  [FascicoloType.PERSONA_FISICA]: 'persona fisica',
  [FascicoloType.PERSONA_GIURIDICA]: 'persona giuridica',
  [FascicoloType.PROCEDIMENTO]: 'procedimento amministrativo',
};

const PROCEDIMENTO_FASE_TO_XSD: Record<string, string> = {
  [ProcedimentoFaseType.PREPARATORIA]: 'Preparatoria',
  [ProcedimentoFaseType.ISTRUTTORIA]: 'Istruttoria',
  [ProcedimentoFaseType.CONSULTIVA]: 'Consultiva',
  [ProcedimentoFaseType.DECISORIA]: 'Decisoria o deliberativa',
  [ProcedimentoFaseType.INTEGRAZIONE]: 'Integrazione dell’efficacia',
};

const ASSEGNAZIONE_TYPE_TO_XSD: Record<string, string> = {
  [AssegnazioneType.COMPETENZA]: 'Per Competenza',
  [AssegnazioneType.CONOSCIENZA]: 'Per Conoscenza',
};

const MODIFICATION_TYPE_TO_XSD: Record<string, string> = {
  [ModificationType.ANNULLAMENTO]: 'Annullamento',
  [ModificationType.RETTIFICA]: 'Rettifica',
  [ModificationType.INTEGRAZIONE]: 'Integrazione',
  [ModificationType.ANNOTAZIONE]: 'Annotazione',
};

function isNil(value: unknown): boolean {
  return value === null || value === undefined;
}

function toTrimmed(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isMeaningful(value: unknown): boolean {
  if (isNil(value)) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length > 0;
  return true;
}

function safePath(path: string): string | null {
  const trimmed = path.trim();
  if (!trimmed || !PATH_REGEX.test(trimmed)) return null;
  return trimmed;
}

function likeCondition(path: string, value: string): SearchConditionDTO {
  return { path, operator: 'LIKE', value: `%${value}%` };
}

function eqCondition(path: string, value: unknown): SearchConditionDTO {
  return { path, operator: 'EQ', value };
}

function scalarCondition(
  path: string,
  value: unknown,
  mode: StringMode = 'LIKE',
): SearchConditionDTO | null {
  const validPath = safePath(path);
  if (!validPath || isNil(value)) return null;

  if (typeof value === 'string') {
    const trimmed = toTrimmed(value);
    if (!trimmed) return null;
    return mode === 'EQ' ? eqCondition(validPath, trimmed) : likeCondition(validPath, trimmed);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return eqCondition(validPath, value);
  }

  return null;
}

function orGroup(items: Array<SearchConditionDTO | SearchGroupDTO>): SearchGroupDTO | null {
  const filtered = items.filter(Boolean);
  if (filtered.length === 0) return null;
  return { logicOperator: 'OR', items: filtered };
}

function andGroup(items: Array<SearchConditionDTO | SearchGroupDTO>): SearchGroupDTO | null {
  const filtered = items.filter(Boolean);
  if (filtered.length === 0) return null;
  return { logicOperator: 'AND', items: filtered };
}

function anyOf(path: string, values: unknown[], mode: StringMode = 'LIKE'): SearchGroupDTO | null {
  const items = values
    .map((v) => scalarCondition(path, v, mode))
    .filter((i): i is SearchConditionDTO => i !== null);
  return orGroup(items);
}

function splitList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === 'string' ? v.trim() : String(v)))
      .filter((v) => v.length > 0);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
  }

  return [];
}

function toPascalCase(value: string): string {
  return value
    .replaceAll(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replaceAll(/[^a-zA-Z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function appendIfPresent(
  items: Array<SearchConditionDTO | SearchGroupDTO>,
  candidate: SearchConditionDTO | SearchGroupDTO | null,
): void {
  if (candidate) items.push(candidate);
}

function mapPredefinedValue(value: unknown, map: Record<string, string>): unknown {
  if (typeof value !== 'string') return value;
  return map[value] ?? value;
}

function normalizeBooleanLike(value: unknown): unknown {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return value;

  const normalized = value.trim().toLowerCase();
  if (normalized === 'true' || normalized === 'si' || normalized === 'sì' || normalized === 'yes') {
    return true;
  }
  if (normalized === 'false' || normalized === 'no') {
    return false;
  }

  return value;
}

function mapDocumentTypeFilter(value: unknown): SearchConditionDTO | null {
  if (value === DocumentType.DOCUMENTO_INFORMATICO) {
    return { path: DOC_ROOT, operator: 'LIKE', value: '%' };
  }

  if (value === DocumentType.DOCUMENTO_AMMINISTRATIVO_INFORMATICO) {
    return { path: 'DocumentoAmministrativoInformatico', operator: 'LIKE', value: '%' };
  }

  if (value === DocumentType.AGGREGAZIONE_DOCUMENTALE) {
    return { path: AGG_ROOT, operator: 'LIKE', value: '%' };
  }

  return null;
}

function buildCommonGroup(common: any): SearchGroupDTO | null {
  if (!common || typeof common !== 'object') return null;

  const items: Array<SearchConditionDTO | SearchGroupDTO> = [];

  appendIfPresent(
    items,
    scalarCondition(`${DOC_ROOT}.ChiaveDescrittiva.Oggetto`, common?.chiaveDescrittiva?.oggetto),
  );
  appendIfPresent(
    items,
    scalarCondition(
      `${DOC_ROOT}.ChiaveDescrittiva.ParoleChiave`,
      common?.chiaveDescrittiva?.paroleChiave,
    ),
  );
  appendIfPresent(
    items,
    scalarCondition(
      `${DOC_ROOT}.Classificazione.IndiceDiClassificazione`,
      common?.classificazione?.codice,
    ),
  );
  appendIfPresent(
    items,
    scalarCondition(
      `${DOC_ROOT}.Classificazione.Descrizione`,
      common?.classificazione?.descrizione,
    ),
  );
  appendIfPresent(
    items,
    scalarCondition(`${DOC_ROOT}.TempoDiConservazione`, common?.conservazione?.valore, 'EQ'),
  );
  appendIfPresent(items, scalarCondition(`${DOC_ROOT}.Note`, common?.note));
  appendIfPresent(items, mapDocumentTypeFilter(common?.tipoDocumento));

  return andGroup(items);
}

function buildDiDaiGroup(diDai: any): SearchGroupDTO | null {
  if (!diDai || typeof diDai !== 'object') return null;

  const items: Array<SearchConditionDTO | SearchGroupDTO> = [];

  appendIfPresent(
    items,
    scalarCondition(
      `${DOC_ROOT}.DatiDiRegistrazione.TipologiaDiFlusso`,
      diDai?.registrazione?.tipologiaFlusso,
      'EQ',
    ),
  );
  appendIfPresent(
    items,
    scalarCondition(
      `${DOC_ROOT}.DatiDiRegistrazione.TipoRegistro.Repertorio_Registro.TipoRegistro`,
      mapPredefinedValue(diDai?.registrazione?.tipologiaRegistro, REGISTER_TYPE_TO_XSD),
      'EQ',
    ),
  );
  appendIfPresent(
    items,
    scalarCondition(
      `${DOC_ROOT}.DatiDiRegistrazione.TipoRegistro.Repertorio_Registro.DataRegistrazioneDocumento`,
      diDai?.registrazione?.dataRegistrazione,
      'EQ',
    ),
  );
  appendIfPresent(
    items,
    scalarCondition(
      `${DOC_ROOT}.DatiDiRegistrazione.TipoRegistro.Repertorio_Registro.OraRegistrazioneDocumento`,
      diDai?.registrazione?.oraRegistrazione,
      'EQ',
    ),
  );
  appendIfPresent(
    items,
    scalarCondition(
      `${DOC_ROOT}.DatiDiRegistrazione.TipoRegistro.Repertorio_Registro.NumeroRegistrazioneDocumento`,
      diDai?.registrazione?.numeroRegistrazione,
      'EQ',
    ),
  );
  appendIfPresent(
    items,
    scalarCondition(
      `${DOC_ROOT}.DatiDiRegistrazione.TipoRegistro.Repertorio_Registro.CodiceRegistro`,
      diDai?.registrazione?.codiceRegistro,
      'LIKE',
    ),
  );

  appendIfPresent(items, scalarCondition(`${DOC_ROOT}.TipologiaDocumentale`, diDai?.tipologia));
  appendIfPresent(
    items,
    scalarCondition(
      `${DOC_ROOT}.ModalitaDiFormazione`,
      mapPredefinedValue(diDai?.modalitaFormazione, DIDAI_FORMATION_TO_XSD),
      'EQ',
    ),
  );
  appendIfPresent(
    items,
    scalarCondition(`${DOC_ROOT}.Riservato`, normalizeBooleanLike(diDai?.riservatezza), 'EQ'),
  );

  appendIfPresent(
    items,
    scalarCondition(
      `${DOC_ROOT}.IdentificativoDelFormato.Formato`,
      diDai?.identificativoFormato?.formato,
      'EQ',
    ),
  );
  appendIfPresent(
    items,
    scalarCondition(
      `${DOC_ROOT}.IdentificativoDelFormato.ProdottoSoftware.NomeProdotto`,
      diDai?.identificativoFormato?.nomeProdottoCreazione,
    ),
  );
  appendIfPresent(
    items,
    scalarCondition(
      `${DOC_ROOT}.IdentificativoDelFormato.ProdottoSoftware.VersioneProdotto`,
      diDai?.identificativoFormato?.versioneProdottoCreazione,
    ),
  );
  appendIfPresent(
    items,
    scalarCondition(
      `${DOC_ROOT}.IdentificativoDelFormato.ProdottoSoftware.Produttore`,
      diDai?.identificativoFormato?.produttoreProdottoCreazione,
    ),
  );

  appendIfPresent(
    items,
    scalarCondition(
      `${DOC_ROOT}.Verifica.FirmatoDigitalmente`,
      diDai?.verifica?.formatoDigitalmente,
      'EQ',
    ),
  );
  appendIfPresent(
    items,
    scalarCondition(
      `${DOC_ROOT}.Verifica.SigillatoElettronicamente`,
      diDai?.verifica?.sigillatoElettr,
      'EQ',
    ),
  );
  appendIfPresent(
    items,
    scalarCondition(
      `${DOC_ROOT}.Verifica.MarcaturaTemporale`,
      diDai?.verifica?.marcaturaTemporale,
      'EQ',
    ),
  );
  appendIfPresent(
    items,
    scalarCondition(
      `${DOC_ROOT}.Verifica.ConformitaCopieImmagineSuSupportoInformatico`,
      diDai?.verifica?.conformitaCopie,
      'EQ',
    ),
  );

  appendIfPresent(items, scalarCondition(`${DOC_ROOT}.NomeDelDocumento`, diDai?.nome));
  appendIfPresent(items, scalarCondition(`${DOC_ROOT}.VersioneDelDocumento`, diDai?.versione));
  appendIfPresent(
    items,
    scalarCondition(`${DOC_ROOT}.IdDoc.Identificativo`, diDai?.idPrimario, 'EQ'),
  );

  const modifications = Array.isArray(diDai?.tracciatureModifiche)
    ? diDai.tracciatureModifiche
    : [];

  const modificationItems = modifications
    .map((modifica: any) => {
      const nestedItems: Array<SearchConditionDTO | SearchGroupDTO> = [];
      appendIfPresent(
        nestedItems,
        scalarCondition(
          'TipoModifica',
          mapPredefinedValue(modifica?.tipoModifica, MODIFICATION_TYPE_TO_XSD),
          'EQ',
        ),
      );
      appendIfPresent(nestedItems, scalarCondition('DataModifica', modifica?.dataModifica, 'EQ'));
      appendIfPresent(nestedItems, scalarCondition('OraModifica', modifica?.oraModifica, 'EQ'));
      appendIfPresent(
        nestedItems,
        scalarCondition('IdentificativoVersionePrecedente', modifica?.idVersionePrec, 'EQ'),
      );

      const nested = andGroup(nestedItems);

      if (!nested) return null;
      return {
        path: `${DOC_ROOT}.TracciatureModificheDocumento`,
        operator: 'ELEM_MATCH' as const,
        value: nested,
      };
    })
    .filter((i: SearchConditionDTO | null): i is SearchConditionDTO => i !== null);

  appendIfPresent(items, orGroup(modificationItems));

  return andGroup(items);
}

function buildAggregateGroup(aggregate: any): SearchGroupDTO | null {
  if (!aggregate || typeof aggregate !== 'object') return null;

  const items: Array<SearchConditionDTO | SearchGroupDTO> = [];

  appendIfPresent(
    items,
    scalarCondition(
      `${AGG_ROOT}.TipoAgg.TipoAggregazione`,
      mapPredefinedValue(aggregate?.tipoAggregazione, AGGREGATION_TYPE_TO_XSD),
      'EQ',
    ),
  );
  appendIfPresent(
    items,
    scalarCondition(`${AGG_ROOT}.TipoAgg.IdAggregazione`, aggregate?.idAggregazione, 'EQ'),
  );
  appendIfPresent(
    items,
    scalarCondition(`${AGG_ROOT}.Progressivo`, aggregate?.progressivoAggregazione, 'EQ'),
  );
  appendIfPresent(
    items,
    scalarCondition(
      `${AGG_ROOT}.TipologiaFascicolo`,
      mapPredefinedValue(aggregate?.tipoFascicolo, FASCICOLO_TYPE_TO_XSD),
      'EQ',
    ),
  );
  appendIfPresent(
    items,
    scalarCondition(`${AGG_ROOT}.DataApertura`, aggregate?.dataApertura, 'EQ'),
  );
  appendIfPresent(
    items,
    scalarCondition(`${AGG_ROOT}.DataChiusura`, aggregate?.dataChiusura, 'EQ'),
  );

  appendIfPresent(
    items,
    scalarCondition(
      `${AGG_ROOT}.ProcedimentoAmministrativo.MateriaArgomentoStruttura`,
      aggregate?.procedimento?.materia,
    ),
  );
  appendIfPresent(
    items,
    scalarCondition(
      `${AGG_ROOT}.ProcedimentoAmministrativo.Procedimento`,
      aggregate?.procedimento?.denominazioneProcedimento,
    ),
  );
  appendIfPresent(
    items,
    scalarCondition(
      `${AGG_ROOT}.ProcedimentoAmministrativo.URIProcedimento`,
      aggregate?.procedimento?.URICatalogo,
      'EQ',
    ),
  );

  const fasi = Array.isArray(aggregate?.procedimento?.fasi) ? aggregate.procedimento.fasi : [];

  const faseMatches = fasi
    .map((fase: any) => {
      const nestedItems: Array<SearchConditionDTO | SearchGroupDTO> = [];
      appendIfPresent(
        nestedItems,
        scalarCondition(
          'TipoFase',
          mapPredefinedValue(fase?.tipoFase, PROCEDIMENTO_FASE_TO_XSD),
          'EQ',
        ),
      );
      appendIfPresent(nestedItems, scalarCondition('DataInizioFase', fase?.dataInizioFase, 'EQ'));
      appendIfPresent(nestedItems, scalarCondition('DataFineFase', fase?.dataFineFase, 'EQ'));

      const nested = andGroup(nestedItems);

      if (!nested) return null;
      return {
        path: `${AGG_ROOT}.ProcedimentoAmministrativo.Fasi`,
        operator: 'ELEM_MATCH' as const,
        value: nested,
      };
    })
    .filter((i: SearchConditionDTO | null): i is SearchConditionDTO => i !== null);

  appendIfPresent(items, orGroup(faseMatches));

  appendIfPresent(
    items,
    scalarCondition(
      `${AGG_ROOT}.Assegnazione.TipoAssegnazione`,
      mapPredefinedValue(aggregate?.assegnazione?.tipoAssegnazione, ASSEGNAZIONE_TYPE_TO_XSD),
      'EQ',
    ),
  );
  appendIfPresent(
    items,
    scalarCondition(
      `${AGG_ROOT}.Assegnazione.DataInizioAssegnazione`,
      aggregate?.assegnazione?.dataInizioAssegn,
      'EQ',
    ),
  );
  appendIfPresent(
    items,
    scalarCondition(
      `${AGG_ROOT}.Assegnazione.DataFineAssegnazione`,
      aggregate?.assegnazione?.dataFineAssegn,
      'EQ',
    ),
  );

  const soggettoAssegn = aggregate?.assegnazione?.soggettoAssegn;
  if (typeof soggettoAssegn === 'string') {
    appendIfPresent(
      items,
      scalarCondition(
        `${AGG_ROOT}.Assegnazione.SoggettoAssegnatario.DenominazioneOrganizzazione`,
        soggettoAssegn,
      ),
    );
  }
  if (soggettoAssegn && typeof soggettoAssegn === 'object') {
    appendIfPresent(
      items,
      scalarCondition(
        `${AGG_ROOT}.Assegnazione.SoggettoAssegnatario.Nome`,
        soggettoAssegn.nomeAssegnatario,
      ),
    );
    appendIfPresent(
      items,
      scalarCondition(
        `${AGG_ROOT}.Assegnazione.SoggettoAssegnatario.Cognome`,
        soggettoAssegn.cognomeAssegnatario,
      ),
    );
    appendIfPresent(
      items,
      scalarCondition(
        `${AGG_ROOT}.Assegnazione.SoggettoAssegnatario.CodiceFiscale`,
        soggettoAssegn.codiceFiscaleAssegnatario,
        'EQ',
      ),
    );
    appendIfPresent(
      items,
      scalarCondition(
        `${AGG_ROOT}.Assegnazione.SoggettoAssegnatario.CodiceFiscale_PartitaIva`,
        soggettoAssegn.partitaIvaAssegnatario,
        'EQ',
      ),
    );
    appendIfPresent(
      items,
      scalarCondition(
        `${AGG_ROOT}.Assegnazione.SoggettoAssegnatario.DenominazioneOrganizzazione`,
        soggettoAssegn.denominazioneOrga,
      ),
    );
    appendIfPresent(
      items,
      scalarCondition(
        `${AGG_ROOT}.Assegnazione.SoggettoAssegnatario.DenominazioneUfficio`,
        soggettoAssegn.denominazioneUfficio,
      ),
    );

    const addresses = splitList(soggettoAssegn.indirizziDigitali);
    appendIfPresent(
      items,
      anyOf(
        `${AGG_ROOT}.Assegnazione.SoggettoAssegnatario.IndirizziDigitaliDiRiferimento`,
        addresses,
      ),
    );
  }

  return andGroup(items);
}

function buildCustomMetaGroup(customMeta: any, documentType: unknown): SearchGroupDTO | null {
  if (!customMeta || typeof customMeta !== 'object') return null;

  const rawEntries = Array.isArray(customMeta) ? customMeta : [customMeta];

  const conditions = rawEntries
    .map((entry) => {
      const field = toTrimmed(entry?.field);
      const value = entry?.value;
      if (!field || !isMeaningful(value)) return null;

      const validPaths = normalizeCustomMetadataPaths(field, documentType);
      if (validPaths.length === 0) return null;

      if (validPaths.length === 1) {
        return scalarCondition(validPaths[0], value, 'LIKE');
      }

      const alternatives = validPaths
        .map((path) => scalarCondition(path, value, 'LIKE'))
        .filter((condition): condition is SearchConditionDTO => condition !== null);

      return orGroup(alternatives);
    })
    .filter((condition): condition is SearchConditionDTO | SearchGroupDTO => condition !== null);

  return andGroup(conditions);
}

function resolveCustomMetadataRoots(documentType: unknown): string[] {
  if (documentType === DocumentType.DOCUMENTO_INFORMATICO) {
    return [DOC_ROOT];
  }

  if (documentType === DocumentType.DOCUMENTO_AMMINISTRATIVO_INFORMATICO) {
    return [DOC_ADMIN_ROOT];
  }

  if (documentType === DocumentType.AGGREGAZIONE_DOCUMENTALE) {
    return [AGG_CUSTOM_META_ROOT];
  }

  return [...CUSTOM_METADATA_ROOTS];
}

function normalizeCustomMetadataPaths(field: string, documentType: unknown): string[] {
  const sanitizedPath = safePath(field);
  if (!sanitizedPath) return [];

  const segments = sanitizedPath.split('.').filter((segment) => segment.length > 0);
  if (segments.length === 0) return [];

  const keySegment = segments.at(-1);
  if (!keySegment) return [];

  // If the user typed only "CustomMetadata" (without key), reject it.
  if (keySegment === 'CustomMetadata') {
    return [];
  }

  const roots = resolveCustomMetadataRoots(documentType);
  const explicitRoot = segments.find((segment) =>
    [DOC_ROOT, DOC_ADMIN_ROOT, AGG_ROOT, AGG_CUSTOM_META_ROOT].includes(segment),
  );

  if (explicitRoot) {
    const normalizedRoot = explicitRoot === AGG_ROOT ? AGG_CUSTOM_META_ROOT : explicitRoot;
    return [`${normalizedRoot}.CustomMetadata.${keySegment}`];
  }

  return roots.map((root) => `${root}.CustomMetadata.${keySegment}`);
}

function resolveSubjectRoots(documentType: unknown): string[] {
  if (documentType === DocumentType.DOCUMENTO_INFORMATICO) {
    return [DOC_ROOT];
  }

  if (documentType === DocumentType.DOCUMENTO_AMMINISTRATIVO_INFORMATICO) {
    return [DOC_ADMIN_ROOT];
  }

  if (documentType === DocumentType.AGGREGAZIONE_DOCUMENTALE) {
    return [AGG_ROOT];
  }

  return [...SUBJECT_ROOTS];
}

function mapSubjectDetailKey(key: string): string {
  const explicit: Record<string, string> = {
    denominazioneOrga: 'DenominazioneOrganizzazione',
    denominazioneUfficio: 'DenominazioneUfficio',
    codiceFiscalePartitaIvaPG: 'CodiceFiscale_PartitaIva',
    codiceFiscalePG: 'CodiceFiscale_PartitaIva',
    partitaIvaPG: 'CodiceFiscale_PartitaIva',
    cognomePF: 'Cognome',
    nomePF: 'Nome',
    cognomeRUP: 'Cognome',
    nomeRUP: 'Nome',
    codiceFiscaleRUP: 'CodiceFiscale',
    nomeAssegnatario: 'Nome',
    cognomeAssegnatario: 'Cognome',
    codiceFiscaleAssegnatario: 'CodiceFiscale',
    partitaIvaAssegnatario: 'CodiceFiscale_PartitaIva',
    denominazioneAmm: 'DenominazioneAmministrazione',
    denominazioneSistema: 'DenominazioneSistema',
    indirizziDigitali: 'IndirizziDigitaliDiRiferimento',
  };

  if (explicit[key]) return explicit[key];

  const stripped = key
    .replaceAll(/(Assegnatario|RUP|PF|PG|PAI|PAE|AS|SW)$/g, '')
    .replace(/^codiceIPAAOO$/i, 'CodiceIPAAOO')
    .replace(/^codiceIPAUOR$/i, 'CodiceIPAUOR');

  return toPascalCase(stripped);
}

function buildSingleSubjectMatch(
  criteria: SubjectCriteria,
  subjectRoot: string,
): SearchConditionDTO | null {
  const role = (criteria as any).role;
  const type = (criteria as any).type;
  const details = (criteria as any).details as Record<string, unknown> | null;

  const roleWrapper = SUBJECT_ROLE_WRAPPER[role] ?? toPascalCase(String(role));
  const roleLabel = SUBJECT_ROLE_LABEL[role] ?? toPascalCase(String(role));
  const typeWrapper = SUBJECT_TYPE_WRAPPER[type] ?? toPascalCase(String(type));

  const nestedItems: Array<SearchConditionDTO | SearchGroupDTO> = [];
  appendIfPresent(nestedItems, scalarCondition(`${roleWrapper}.TipoRuolo`, roleLabel, 'EQ'));

  const detailEntries = Object.entries(details ?? {});
  for (const [detailKey, detailValue] of detailEntries) {
    if (!isMeaningful(detailValue)) continue;

    const metadataField = mapSubjectDetailKey(detailKey);
    const detailPath = `${roleWrapper}.${typeWrapper}.${metadataField}`;

    if (detailKey === 'indirizziDigitali') {
      const values = splitList(detailValue);
      appendIfPresent(nestedItems, anyOf(detailPath, values));
      continue;
    }

    appendIfPresent(
      nestedItems,
      scalarCondition(
        detailPath,
        detailValue,
        detailKey.toLowerCase().includes('codice') ? 'EQ' : 'LIKE',
      ),
    );
  }

  const nested = andGroup(nestedItems);
  if (!nested) return null;

  return {
    path: `${subjectRoot}.Soggetti.Ruolo`,
    operator: 'ELEM_MATCH',
    value: nested,
  };
}

function buildSubjectGroup(
  subjects: SubjectCriteria[],
  documentType: unknown,
): SearchGroupDTO | null {
  if (!Array.isArray(subjects) || subjects.length === 0) return null;

  const roots = resolveSubjectRoots(documentType);

  const items = subjects
    .flatMap((criteria) =>
      roots
        .map((root) => buildSingleSubjectMatch(criteria, root))
        .filter((match): match is SearchConditionDTO => match !== null),
    )
    .filter((i): i is SearchConditionDTO => i !== null);

  return orGroup(items);
}

export function toSearchRequestDTO(filters: SearchFilters): SearchRequestDTO | null {
  const groups: Array<SearchGroupDTO | SearchConditionDTO> = [];

  appendIfPresent(groups, buildCommonGroup((filters as any)?.common));
  appendIfPresent(groups, buildDiDaiGroup((filters as any)?.diDai));
  appendIfPresent(groups, buildAggregateGroup((filters as any)?.aggregate));
  appendIfPresent(
    groups,
    buildCustomMetaGroup((filters as any)?.customMeta, (filters as any)?.common?.tipoDocumento),
  );
  appendIfPresent(
    groups,
    buildSubjectGroup((filters as any)?.subject ?? [], (filters as any)?.common?.tipoDocumento),
  );

  const root = andGroup(groups);
  if (!root) return null;

  return { filter: root };
}

export function hasMeaningfulAdvancedFilters(filters: SearchFilters): boolean {
  return toSearchRequestDTO(filters) !== null;
}
