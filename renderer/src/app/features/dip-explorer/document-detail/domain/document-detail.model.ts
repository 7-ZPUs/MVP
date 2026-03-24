export interface HashDocumentoDTO {
  Impronta: string;
  Algoritmo: string;
}

export interface IdDocDTO {
  ImprontaCrittograficaDelDocumento: HashDocumentoDTO;
  Identificativo: string;
}

export interface PersonaFisicaDTO {
  Cognome: string;
  Nome: string;
  IndirizziDigitaliDiRiferimento?: string;
}

export interface AssegnatarioDTO {
  Cognome: string;
  Nome: string;
  CodiceFiscale: string;
  DenominazioneOrganizzazione: string;
  DenominazioneUfficio: string;
  IndirizziDigitaliDiRiferimento?: string;
}

export interface PersonaGiuridicaDTO {
  DenominazioneOrganizzazione: string;
  CodiceFiscale_PartitaIva: string;
  DenominazioneUfficio?: string;
}

export interface RuoloSoggettoDTO {
  TipoRuolo: string;
  PF?: PersonaFisicaDTO;
  AS?: AssegnatarioDTO;
  PG?: PersonaGiuridicaDTO;
}

export interface TipoAggDTO {
  TipoAggregazione: string;
  IdAggregazione: string;
}

export interface AggDTO {
  TipoAgg: TipoAggDTO;
}

export interface DocumentoInformaticoDTO {
  IdDoc: IdDocDTO;
  ModalitaDiFormazione: string;
  TipologiaDocumentale: string;
  DatiDiRegistrazione: {
    TipologiaDiFlusso: string;
    TipoRegistro: {
      Repertorio_Registro: {
        TipoRegistro: string;
        DataRegistrazioneDocumento: string;
        NumeroRegistrazioneDocumento: string;
        CodiceRegistro: string;
      };
    };
  };
  Soggetti: {
    Ruolo: Array<Record<string, RuoloSoggettoDTO>>;
  };
  ChiaveDescrittiva: {
    Oggetto: string;
    ParoleChiave: string[];
  };
  Allegati: {
    NumeroAllegati: string;
    IndiceAllegati: {
      IdDoc: IdDocDTO;
      Descrizione: string;
    };
  };
  Classificazione: {
    IndiceDiClassificazione: string;
    Descrizione: string;
    PianoDiClassificazione: string;
  };
  Riservato: string;
  IdentificativoDelFormato: {
    Formato: string;
  };
  Verifica: {
    FirmatoDigitalmente: string;
    SigillatoElettronicamente: string;
    MarcaturaTemporale: string;
    ConformitaCopieImmagineSuSupportoInformatico: string;
  };
  Agg: {
    TipoAgg: {
      TipoAggregazione: string;
      IdAggregazione: string;
    };
  };
  NomeDelDocumento: string;
  VersioneDelDocumento: string;
  TempoDiConservazione: string;
  Note: string;
}

export interface DocumentDetailDTO {
  DocumentoInformatico: DocumentoInformaticoDTO;
  fileData?: string | Uint8Array | Blob | null;
}
