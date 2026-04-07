export enum DocContext {
  DI = "DI", // Documento Informatico
  DAI = "DAI", // Documento Amministrativo Informatico
  AGG = "AGG", // Aggregazione Documentale
  ALL = "ALL", // Ricerca Globale (Nessun contesto specifico)
}

export enum SubjectRoleType {
  // Comuni a DI e DAI
  AUTORE = "Autore",
  DESTINATARIO = "Destinatario",
  MITTENTE = "Mittente",
  OPERATORE = "Operatore",
  PRODUTTORE = "Produttore",
  RGD = "Responsabile Gestione Documentale",
  RSP = "Responsabile Servizio Protocollo",

  // Specifico DI
  SOGGETTO_REGISTRAZIONE = "Soggetto che effettua la registrazione",
  ALTRO = "Altro",

  // Specifico DAI
  AMMINISTRAZIONE_REGISTRAZIONE = "Amministrazione che effettua la registrazione",

  // Comuni a DAI e AGG
  RUP = "RUP",

  // Comuni a DI, DAI e AGG
  ASSEGNATARIO = "Assegnatario",

  // Specifico AGG
  AMMINISTRAZIONE_TITOLARE = "Amministrazione titolare",
  AMMINISTRAZIONE_PARTECIPANTE = "Amministrazioni partecipanti",
  INTESTATARIO_PF = "Soggetto intestatario persona fisica",
  INTESTATARIO_PG = "Soggetto intestatario persona giuridica",
}

export enum SubjectType {
  PAI = "PAI",
  PAE = "PAE",
  PG = "PG",
  PF = "PF",
  AS = "AS",
  RUP = "RUP",
  SW = "SW",
  ALTRO = "ALTRO",
}
