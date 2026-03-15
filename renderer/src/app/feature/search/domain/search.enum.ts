export enum SearchQueryType {
  FREE = 'FREE',
  CLASS = 'CLASS',
  PROCESS = 'PROCESS',
}

export enum FilterFieldType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  ENUM = 'ENUM',
  BOOLEAN = 'BOOLEAN',
}

export enum DocumentType {
  DOCUMENTO_INFORMATICO = 'DOCUMENTO INFORMATICO',
  DOCUMENTO_AMMINISTRATIVO_INFORMATICO = 'DOCUMENTO AMMINISTRATIVO INFORMATICO',
  AGGREGAZIONE_DOCUMENTALE = 'AGGREGAZIONE DOCUMENTALE',
}

export enum SubjectRole {
  PRODUTTORE = 'PRODUTTORE',
  DESTINATARIO = 'DESTINATARIO',
  RESPONSABILE = 'RESPONSABILE',
}

export enum SubjectType {
  PAI = 'PAI',
  PAE = 'PAE',
  PG = 'PG',
  PF = 'PF',
  AS = 'AS',
  RUP = 'RUP',
  SW = 'SW',
}

export enum IndexingStatus {
  IDLE = 'IDLE',
  INDEXING = 'INDEXING',
  READY = 'READY',
  ERROR = 'ERROR',
  TIMEOUT = 'TIMEOUT',
  CANCELLED = 'CANCELLED',
}

export enum FlowType {
  ENTRATA = 'ENTRATA',
  USCITA = 'USCITA',
  INTERNO = 'INTERNO',
}

export enum RegisterType {
  PROTOCOLLO = 'PROTOCOLLO ORDINARIO/EMERGENZA',
  REPERTORIO = 'REPERTORIO/REGISTRO',
  NESSUNO = 'NESSUNO',
}

export enum DIDAIFormation {
  EX_NOVO = 'creazione tramite l’utilizzo di strumenti software che assicurino la produzione di documenti nei formati previsti nell’Allegato 2 delle Linee Guida',
  ACQUISIZIONE = 'acquisizione di un documento informatico per via telematica o su supporto informatico, acquisizione della copia per immagine su supporto informatico di un documento analogico, acquisizione della copia informatica di un documento analogico',
  MEMORIZZAZIONE = 'memorizzazione su supporto informatico in formato digitale delle informazioni risultanti da transazioni o processi informatici o dalla presentazione telematica di dati attraverso moduli o formulari resi disponibili all’utente',
  GENERAZIONE = 'generazione o raggruppamento anche in via automatica di un insieme di dati o registrazioni, provenienti da una o più banche dati, anche appartenenti a più soggetti interoperanti, secondo una struttura logica predeterminata e memorizzata in forma statica',
}

export enum AGIDFormats {
  PDF = 'PDF', //(Portable Document Format)
  WORD2007 = 'WORD 2007', //(OOXML, .docx)
  MS_DOC = 'MS-DOC', //(Microsoft Word Binary File Format, deprecato)
  ODT = 'ODT', //(Open Document Text)
  RICHTEXT = 'RICHTEXT', //(RTF, deprecato)
  EPUB = 'EPUB',
  INDESIGNML = 'INDESIGNML', //(Adobe InDesign Markup Language, .idml)
  POSTSCRIPT = 'POSTSCRIPT', //( .ps, deprecato)
  LATEX = 'LATEX', //(.tex)
  // Ipertesti
  XML = 'XML', //(Extensible Markup Language)
  HTML = 'HTML', //(Hypertext Markup Language)
  XHTML = 'XHTML', //(Extensible Hypertext Markup Language)
  XSD = 'XSD', //(XML Schema Definition)
  XSL = 'XSL', //(Extensible Stylesheet Language)
  XSLT = 'XSLT', //(Extensible Stylesheet Language Transformations)
  CSS = 'CSS', //(Cascaded Style Sheet)
  MARKDOWN = 'MARKDOWN', //(.md)
  MATHML = 'MATHML', //(Mathematical Markup Language)
  // Dati Strutturati
  SQL = 'SQL', //(Structured Query Language)
  ACCESS_2007 = 'ACCESS 2007', //(.accdb)
  MS_MDB = 'MS-MDB', //(.mdb, deprecato)
  ODB = 'ODB', //(Open Document Format for Database, deprecato)
  JSON = 'JSON', //(JavaScript Object Notation)
  JSON_LD = 'JSON-LD', //(JSON for Linked Data)
  CSV = 'CSV', //(Comma-Separated Value)
  JWT = 'JWT', //(JSON Web Token) Posta Elettronica
  EML = 'EML', //(Electronic Mail Format)
  MBOX = 'MBOX', //("default" mbox database format)
  MS_PST = 'MS-PST', //(Microsoft Outlook Personal Folder file)
  // Fogli di Calcolo e Presentazioni
  EXCEL_2007 = 'EXCEL 2007', //(OOXML, .xlsx)
  POWERPOINT_2007 = 'POWERPOINT 2007', //(OOXML, .pptx)
  MS_XLS = 'MS-XLS', //(Microsoft Excel Binary file format, deprecato)
  MS_PPT = 'MS-PPT', //(Microsoft PowerPoint Binary format, deprecato)
  ODS = 'ODS', //(Open Document Format for Office Spreadsheets)
  ODP = 'ODP', //(Open Document Format for Presentations)
  // Immagini Raster
  PNG = 'PNG', //(Portable Network Graphics)
  JPEG = 'JPEG', //(JFIF)
  TIFF = 'TIFF', //(Tagged Image File Format)
  GIF = 'GIF', //(Graphic Image file Format, deprecato in molti ambiti)
  EXR = 'EXR', //(OpenEXR)
  JPEG2000 = 'JPEG2000', //(JPEG 2000)
  DICOM = 'DICOM', //(Digital Imaging and Communications in Medicine)
  DNG = 'DNG', //(Adobe Digital Negative)
  PSD = 'PSD', //(Adobe Photoshop Standard Baseline file)
  ARRIRAW = 'ARRIRAW', //(.ari)
  DPX = 'DPX', //(Digital Picture Exchange)
  ACES = 'ACES', //(Academy Color Encoding System)
  // Immagini Vettoriali e Modellazione
  SVG = 'SVG', //(Scalable Vector Graphics)
  ILLUSTRATOR = 'ILLUSTRATOR', //(Adobe Illustrator artwork, .ai)
  ENCAPSULATED_POSTSCRIPT = 'ENCAPSULATED POSTSCRIPT', //(EPS, deprecato)
  ODG = 'ODG', //(Open Document Graphics)
  DXF = 'DXF', //(AutoCAD Drawing Interchange Format)
  DWF = 'DWF', //(AutoCAD Design Web Format)
  DWG = 'DWG', //(Autodesk AutoCAD Drawing)
  FBX = 'FBX', //(Autodesk FBX)
  STL = 'STL', //(Stereolithography file format)
  // Caratteri Tipografici
  OPENTYPE = 'OPENTYPE', //( .otf)
  TRUETYPE = 'TRUETYPE', //( .ttf)
  WOFF = 'WOFF', //(Web Open Font Format)
  // Audio e Musica
  WAV = 'WAV', //(Waveform File)
  MP3 = 'MP3', //(MPEG-1, Layer 3)
  AIFF = 'AIFF', //(Audio Interchange File Format)
  FLAC = 'FLAC', //(Free Lossless Audio Codec)
  RAW = 'RAW', //(Audio "Raw")
  VORBIS = 'VORBIS', //(Vorbis Audio Codec)
  MUSICXML = 'MUSICXML', //(MusicXML Format)
  MIDI = 'MIDI', //(Musical Instrument Digital Interface)
  // Video (Codec)
  HEVC_H265 = 'HEVC/H.265',
  H264_AVC = 'H.264 / AVC',
  MP4V = 'MP4V (MPEG-4 Part 2)',
  H263 = 'H.263 (XviD)',
  MPEG2 = 'MPEG2 (MPEG-2 Part 2)',
  DNXHD_DNXHR = 'DNXHD / DNXHR',
  PRORES = 'PRORES',
}

export enum ModificationType {
  ANNULLAMENTO = 'ANNULLAMENTO',
  RETTIFICA = 'RETTIFICA',
  INTEGRAZIONE = 'INTEGRAZIONE',
  ANNOTAZIONE = 'ANNOTAZIONE',
}

export enum AggregationType {
  FASCICOLO = 'FASCICOLO',
  SERIE_DOCUMENTALE = 'SERIE DOCUMENTALE',
  SERIE_FASCICOLI = 'SERIE FASCICOLI',
}

export enum FascicoloType {
  AFFARE = 'AFFARE',
  ATTIVITA = 'ATTIVITÀ',
  PERSONA_FISICA = 'PERSONA FISICA',
  PERSONA_GIURIDICA = 'PERSONA GIURIDICA',
  PROCEDIMENTO = 'PROCEDIMENTO',
}

export enum ProcedimentoFaseType {
  PREPARATORIA = 'PREPARATORIA',
  ISTRUTTORIA = 'ISTRUTTORIA',
  CONSULTIVA = 'CONSULTIVA',
  DECISORIA = 'DECISORIA O DELIBERATIVA',
  INTEGRAZIONE = "INTEGRAZIONE DELL'EFFICACIA",
}

export enum AssegnazioneType {
  COMPETENZA = 'PER COMPETENZA',
  CONOSCIENZA = 'PER CONOSCIENZA',
}

export enum SubjectRoleType {
  PAI = 'PAI',
  PAE = 'PAE',
  AS = 'AS',
  PG = 'PG',
  PF = 'PF',
  RUP = 'RUP',
  SW = 'SW',
  ALTRO = '',
}

export enum SubjectType {
  ASSEGNATARIO = 'ASSEGNATARIO',
  REGISTRAZIONE = 'SOGGETTO CHE EFFETTUA LA REGISTRAZIONE',
  MITTENTE = 'MITTENTE',
  DESTINATARIO = 'DESTINATARIO',
  ALTRO = 'ALTRO',
  AUTORE = 'AUTORE',
  OPERATORE = 'OPERATORE',
  RGD = 'RESPONSABILE DELLA GESTIONE DOCUMENTALE',
  RSP = 'RESPONSABILE DEL SERVIZIO PROTOCOLLO',
}
