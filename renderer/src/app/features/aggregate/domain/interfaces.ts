export interface AggregazioneDocumentaliInformaticheType {
  IdAgg: IdAggType;
  TipologiaFascicolo?: TipologiaFascicoloType;
  Soggetti: SoggettiType;
  Assegnazione: AssegnazioneType;
  DataApertura: string;
  Classificazione: ClassificazioneType;
  Progressivo: ProgressivoType;
  ChiaveDescrittiva: ChiaveDescrittivaType;
  DataChiusura?: string;
  ProcedimentoAmministrativo?: ProcedimentoAmministrativoType;
  IndiceDocumenti: IndiceDocumentiType;
  PosizioneFisicaAggregazioneDocumentale?: string;
  IdAggPrimario?: IdAggType;
  TempoDiConservazione?: number;
  Note?: string;
}

export interface IdAggType {
  TipoAggregazione: TipoAggregazioneType;
  IdAggregazione: string;
}

export enum TipoAggregazioneType {
  Fascicolo = 'Fascicolo',
  SerieDocumentale = 'Serie Documentale',
  SerieDiFascicoli = 'Serie di Fascicoli',
}

export enum TipologiaFascicoloType {
  Affare = 'Affare',
  Attività = 'Attività',
  PersonaFisica = 'Persona Fisica',
  PersonaGiuridica = 'Persona Giuridica',
  ProcedimentoAmministrativo = 'Procedimento Amministrativo',
}

export interface SoggettiType {
  Ruolo: RuoloType;
  AmministrazioneTitolare: TipoSoggetto1Type;
  AmministrazionePartecipante: TipoSoggetto6Type;
  SoggettoIntestatarioPersonaGiuridica: TipoSoggetto2Type;
  SoggettoIntestatarioPersonaFisica: TipoSoggetto3Type;
  RUP: TipoSoggetto4Type;
  Assegnatario: TipoSoggetto5Type;
}

export interface TipoSoggetto1Type {
  

export interface ImprontaCrittograficaDelDocumentoType {
  Impronta: string;
  Algoritmo: string;
}

export interface DatiDiRegistrazioneType {
  TipologiaDiFlusso: 'E' | 'U' | 'I';
  TipoRegistro: TipoRegistroType;
}

export interface TipoRegistroType {
  Nessuno?: NoRegistroType;
  ProtocolloOrdinario_ProtocolloEmergenza?: ProtocolloType;
  Repertorio_Registro?: NoProtocolloType;
}

export interface NoRegistroType {
  TipoRegistro: 'Nessuno';
  DataDocumento: string;
  OraDocumento?: string;
  NumeroDocumento: string;
}

export interface ProtocolloType {
  TipoRegistro: 'ProtocolloOrdinario\\ProtocolloEmergenza';
  DataProtocollazioneDocumento: string;
  OraProtocollazioneDocumento?: string;
  NumeroProtocolloDocumento: string;
  CodiceRegistro: string;
}

export interface NoProtocolloType {
  TipoRegistro: 'Repertorio\\Registro';
  DataRegistrazioneDocumento: string;
  OraRegistrazioneDocumento?: string;
  NumeroRegistrazioneDocumento: string;
  CodiceRegistro: string;
}

export interface SoggettiType {
  Ruolo: RuoloType;
}

export interface RuoloType {
  SoggettoCheEffettuaLaRegistrazione?: TipoSoggetto21Type;
  Assegnatario?: TipoSoggetto22Type;
  Destinatario?: TipoSoggetto11Type;
  Mittente?: TipoSoggetto12Type;
  Autore?: TipoSoggetto31Type;
  Operatore?: TipoSoggetto32Type;
  ResponsabileGestioneDocumentale?: TipoSoggetto33Type;
  ResponsabileServizioProtocollo?: TipoSoggetto34Type;
  Produttore?: TipoSoggetto4Type;
  Altro?: TipoSoggetto13Type;
}

export interface TipoSoggetto11Type {
  TipoRuolo: 'Destinatario';
  PF?: PFType;
  PG?: PGType;
  PAI?: PAIType;
  PAE?: PAEType;
}

export interface TipoSoggetto12Type {
  TipoRuolo: 'Mittente';
  PF?: PFType;
  PG?: PGType;
  PAI?: PAIType;
  PAE?: PAEType;
}

export interface TipoSoggetto13Type {
  TipoRuolo: 'Altro';
  PF?: PFType;
  PG?: PGType;
  PAI?: PAIType;
  PAE?: PAEType;
}

export interface TipoSoggetto21Type {
  TipoRuolo: 'Soggetto Che Effettua La Registrazione';
  PF?: PFType;
  PG?: PGType;
}

export interface TipoSoggetto22Type {
  TipoRuolo: 'Assegnatario';
  AS?: ASType;
}

export interface ASType {
  Cognome?: string;
  Nome?: string;
  CodiceFiscale?: string;
  DenominazioneOrganizzazione: string;
  DenominazioneUfficio: string;
  IndirizziDigitaliDiRiferimento?: string[];
}

export interface TipoSoggetto31Type {
  TipoRuolo: 'Autore';
  PF?: PFType;
  PG?: PGType;
  PAI?: PAIType;
  PAE?: PAEType;
}

export interface TipoSoggetto32Type {
  TipoRuolo: 'Operatore';
  PF?: PFType;
}

export interface TipoSoggetto33Type {
  TipoRuolo: 'Responsabile della Gestione Documentale';
  PF?: PFType;
}

export interface TipoSoggetto34Type {
  TipoRuolo: 'Responsabiledel Servizio di Protocollo';
  PF?: PFType;
}

export interface TipoSoggetto4Type {
  TipoRuolo: 'Produttore';
  SW?: SWType;
}

export interface PFType {
  Cognome: string;
  Nome: string;
  CodiceFiscale: string;
  IndirizziDigitaliDiRiferimento?: string[];
}

export interface PGType {
  DenominazioneOrganizzazione: string;
  CodiceFiscale_PartitaIva?: string;
  DenominazioneUfficio?: string;
  IndirizziDigitaliDiRiferimento?: string[];
}

export interface PAIType {
  IPAAmm?: CodiceIPAType;
  IPAAOO?: CodiceIPAType;
  IPAUOR?: CodiceIPAType;
  IndirizziDigitaliDiRiferimento?: string[];
}

export interface PAEType {
  DenominazioneAmministrazione: string;
  DenominazioneUfficio?: string;
  IndirizziDigitaliDiRiferimento?: string[];
}

export interface CodiceIPAType {
  Denominazione: string;
  CodiceIPA: string;
}

export interface SWType {
  DenominazioneSistema: string;
}

export interface ChiaveDescrittivaType {
  Oggetto: string;
  ParoleChiave?: string[];
}

export interface AllegatiType {
  NumeroAllegati: number;
  IndiceAllegati?: IndiceAllegatiType;
}

export interface IndiceAllegatiType {
  IdDoc: IdDocType;
  Descrizione: string;
}

export interface ClassificazioneType {
  IndiceDiClassificazione?: string;
  Descrizione?: string;
  PianoDiClassificazione?: string;
}

export interface IdentificativoDelFormatoType {
  Formato: string;
  ProdottoSoftware?: ProdottoSoftwareType;
}

export interface ProdottoSoftwareType {
  NomeProdotto?: string;
  VersioneProdotto?: string;
  Produttore?: string;
}

export interface VerificaType {
  FirmatoDigitalmente: boolean;
  SigillatoElettronicamente: boolean;
  MarcaturaTemporale: boolean;
  ConformitaCopieImmagineSuSupportoInformatico: boolean;
}

export interface AggType {
  TipoAgg?: IdAggType;
}

export interface IdAggType {
  TipoAggregazione: TipoAggregazioneType;
  IdAggregazione: string;
}

export interface TracciatureModificheDocumentoType {
  TipoModifica: TipoModificaType;
  SoggettoAutoreDellaModifica: PFType;
  DataModifica: string;
  OraModifica?: string;
  IdDocVersionePrecedente: IdDocType;
}

export enum TipoModificaType {
  Annullamento = 'Annullamento',
  Rettifica = 'Rettifica',
  Integrazione = 'Integrazione',
  Annotazione = 'Annotazione',
}

export interface DocumentoAmministrativoInformaticoType {
  IdDoc: IdDocType;
  ModalitaDiFormazione:
    | 'creazione tramite utilizzo di strumenti software che assicurino la produzione di documenti nei formati previsti in allegato 2'
    | 'acquisizione di un documento informatico per via telematica o su supporto informatico, acquisizione della copia per immagine su supporto informatico di un documento analogico, acquisizione della copia informatica di un documento analogico'
    | 'memorizzazione su supporto informatico in formato digitale delle informazioni risultanti da transazioni o processi informatici o dalla presentazione telematica di dati attraverso moduli o formulari resi disponibili ad utente'
    | 'generazione o raggruppamento anche in via automatica di un insieme di dati o registrazioni, provenienti da una o più banche dati, anche appartenenti a più soggetti interoperanti, secondo una struttura logica predeterminata e memorizzata in forma statica';
  TipologiaDocumentale: string;
  DatiDiRegistrazione: DatiDiRegistrazioneAmministrativiType;
  Soggetti: SoggettiAmministrativiType;
  ChiaveDescrittiva: ChiaveDescrittivaType;
  Allegati: AllegatiType;
  Classificazione: ClassificazioneType;
  Riservato: boolean;
  IdentificativoDelFormato: IdentificativoDelFormatoType;
  Verificazioni: VerificaType;
  Agg: AggType;
  IdIdentificativoDocumentoPrimario?: IdDocType;
  NomeDelDocumento: string;
  VersioneDelDocumento: string;
  TracciatureModificheDocumento?: TracciatureModificheDocumentoType;
  TempoDiConservazione?: number;
  Note?: string;
}

export interface DatiDiRegistrazioneAmministrativiType {
  TipologiaDiFlusso: 'E' | 'U' | 'I';
  TipoRegistro: TipoRegistroAmministrativoType;
}

export interface TipoRegistroAmministrativoType {
  ProtocolloOrdinario_ProtocolloEmergenza?: ProtocolloType;
  Repertorio_Registro?: NoProtocolloType;
}

export interface SoggettiAmministrativiType {
  Ruolo: RuoloAmministrativoType;
}

export interface RuoloAmministrativoType {
  AmministrazioneCheEffettuaLaRegistrazione?: TipoSoggetto1Type;
  Assegnatario?: TipoSoggetto2Type;
  Destinatario?: TipoSoggetto31Type;
  Mittente?: TipoSoggetto32Type;
  Autore?: TipoSoggetto41Type;
  Operatore?: TipoSoggetto42Type;
  ResponsabileGestioneDocumentale?: TipoSoggetto43Type;
  ResponsabileServizioProtocollo?: TipoSoggetto44Type;
  Produttore?: TipoSoggetto5Type;
  RUP?: TipoSoggetto6Type;
}

export interface TipoSoggetto1Type {
  TipoRuolo: 'Amministrazione Che Effettua La Registrazione';
  PAI: PAIAmmType;
}

export interface TipoSoggetto2Type {
  TipoRuolo: 'Assegnatario';
  AS: ASAmmType;
}

export interface TipoSoggetto41Type {
  TipoRuolo: 'Autore';
  PF?: PFAmmType;
  PG?: PGType;
  PAI?: PAIAmmType;
  PAE?: PAEType;
}

export interface TipoSoggetto42Type {
  TipoRuolo: 'Operatore';
  PF: PFAmmType;
}

export interface TipoSoggetto43Type {
  TipoRuolo: 'Responsabile della Gestione Documentale';
  PF: PFAmmType;
}

export interface TipoSoggetto44Type {
  TipoRuolo: 'Responsabile del Servizio di Protocollo';
  PF: PFAmmType;
}

export interface TipoSoggetto5Type {
  TipoRuolo: 'Produttore';
  SW: SWType;
}

export interface TipoSoggetto6Type {
  TipoRuolo: 'RUP';
  RUP: RUPType;
}

export interface RUPType {
  Cognome: string;
  Nome: string;
  CodiceFiscale?: string;
  IPAAmm?: CodiceIPAType;
  IPAAOO?: CodiceIPAType;
  IPAUOR?: CodiceIPAType;
  IndirizziDigitaliDiRiferimento: string[];
}

export interface PFAmmType {
  Cognome: string;
  Nome: string;
  CodiceFiscale?: string;
  IPAAmm?: CodiceIPAType;
  IPAAOO?: CodiceIPAType;
  IPAUOR?: CodiceIPAType;
  IndirizziDigitaliDiRiferimento?: string[];
}

export interface PAIAmmType {
  IPAAmm: CodiceIPAType;
  IPAAOO: CodiceIPAType;
  IPAUOR?: CodiceIPAType;
  IndirizziDigitaliDiRiferimento: string[];
}

export interface ASAmmType {
  Cognome?: string;
  Nome?: string;
  CodiceFiscale?: string;
  IPAAmm: CodiceIPAType;
  IPAAOO: CodiceIPAType;
  IPAUOR: CodiceIPAType;
  IndirizziDigitaliDiRiferimento: string[];
}
