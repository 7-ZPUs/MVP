import {
  SearchConditionDTO,
  SearchFilters,
  SearchGroupDTO,
  SearchRequestDTO,
} from '../../../../../../shared/domain/metadata/search.models';
import { DocumentType } from '../../../../../../shared/domain/metadata/search.enum';
import {
  SubjectRoleType,
  SubjectType,
} from '../../../../../../shared/domain/metadata/subject.enum';
import { SubjectCriteria } from '../../../../../../shared/domain/metadata/search-subject-filters-models';

type StringMode = 'LIKE' | 'EQ';

const DOC_ROOT = 'DocumentoInformatico';
const AGG_ROOT = 'AggregazioneDocumentale';
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
  [SubjectRoleType.RSP]: 'Responsabile del Servizio Protocollo',
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
      diDai?.registrazione?.tipologiaRegistro,
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
    scalarCondition(`${DOC_ROOT}.ModalitaDiFormazione`, diDai?.modalitaFormazione, 'EQ'),
  );
  appendIfPresent(items, scalarCondition(`${DOC_ROOT}.Riservato`, diDai?.riservatezza, 'EQ'));

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
      appendIfPresent(nestedItems, scalarCondition('TipoModifica', modifica?.tipoModifica, 'EQ'));
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
    scalarCondition(`${AGG_ROOT}.TipoAgg.TipoAggregazione`, aggregate?.tipoAggregazione, 'EQ'),
  );
  appendIfPresent(
    items,
    scalarCondition(`${AGG_ROOT}.TipoAgg.IdAggregazione`, aggregate?.idAggregazione, 'EQ'),
  );
  appendIfPresent(
    items,
    scalarCondition(`${AGG_ROOT}.TipologiaFascicolo`, aggregate?.tipoFascicolo, 'EQ'),
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
      appendIfPresent(nestedItems, scalarCondition('TipoFase', fase?.tipoFase, 'EQ'));
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
      aggregate?.assegnazione?.tipoAssegnazione,
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

function buildCustomMetaGroup(customMeta: any): SearchGroupDTO | null {
  if (!customMeta || typeof customMeta !== 'object') return null;

  const field = toTrimmed(customMeta.field);
  const value = customMeta.value;
  if (!field || !isMeaningful(value)) return null;

  const validPath = safePath(field);
  if (!validPath) return null;

  const condition = scalarCondition(validPath, value, 'LIKE');
  return condition ? andGroup([condition]) : null;
}

function mapSubjectDetailKey(key: string): string {
  const explicit: Record<string, string> = {
    denominazioneOrga: 'DenominazioneOrganizzazione',
    denominazioneUfficio: 'DenominazioneUfficio',
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

function buildSingleSubjectMatch(criteria: SubjectCriteria): SearchConditionDTO | null {
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
    path: `${DOC_ROOT}.Soggetti.Ruolo`,
    operator: 'ELEM_MATCH',
    value: nested,
  };
}

function buildSubjectGroup(subjects: SubjectCriteria[]): SearchGroupDTO | null {
  if (!Array.isArray(subjects) || subjects.length === 0) return null;

  const items = subjects
    .map((criteria) => buildSingleSubjectMatch(criteria))
    .filter((i): i is SearchConditionDTO => i !== null);

  return orGroup(items);
}

export function toSearchRequestDTO(filters: SearchFilters): SearchRequestDTO | null {
  const groups: Array<SearchGroupDTO | SearchConditionDTO> = [];

  appendIfPresent(groups, buildCommonGroup((filters as any)?.common));
  appendIfPresent(groups, buildDiDaiGroup((filters as any)?.diDai));
  appendIfPresent(groups, buildAggregateGroup((filters as any)?.aggregate));
  appendIfPresent(groups, buildCustomMetaGroup((filters as any)?.customMeta));
  appendIfPresent(groups, buildSubjectGroup((filters as any)?.subject ?? []));

  const root = andGroup(groups);
  if (!root) return null;

  return { filter: root };
}

export function hasMeaningfulAdvancedFilters(filters: SearchFilters): boolean {
  return toSearchRequestDTO(filters) !== null;
}
