import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  FlowType,
  DocumentType,
} from "../../../../shared/domain/metadata/search.enum";

vi.mock("electron", () => ({ app: { isPackaged: false } }));
vi.mock("@xenova/transformers", () => ({
  pipeline: vi.fn(),
  env: {
    localModelPath: "",
    allowLocalModels: true,
    allowRemoteModels: false,
    useBrowserCache: false,
    backends: { onnx: { executionProviders: [], wasm: { numThreads: 1 } } },
  },
}));

import { DocumentRepository } from "../../../src/repo/impl/DocumentRepository";
import { IWordEmbedding } from "../../../src/repo/IWordEmbedding";
import { SearchFilters } from "../../../../shared/domain/metadata/search.models";
import {
  AGIDFormats,
  DIDAIFormation,
  RegisterType,
  AggregationType,
  FascicoloType,
  AssegnazioneType,
} from "../../../../shared/metadata/search.enum";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeDb = (
  prepareResult: Partial<{ get: any; all: any; run: any }> = {},
) => {
  const stmt = {
    get: vi.fn().mockReturnValue(prepareResult.get ?? null),
    all: vi.fn().mockReturnValue(prepareResult.all ?? []),
    run: vi.fn().mockReturnValue(prepareResult.run ?? { lastInsertRowid: 1 }),
  };
  return {
    exec: vi.fn(),
    prepare: vi.fn().mockReturnValue(stmt),
    _stmt: stmt,
  };
};

const makeAiAdapter = (
  vector = new Float32Array(384).fill(0.1),
): IWordEmbedding => ({
  generateEmbedding: vi.fn().mockResolvedValue(vector),
  isInitialized: vi.fn().mockReturnValue(true),
});

const makeRepo = (db = makeDb(), ai = makeAiAdapter()) => {
  const repo = new DocumentRepository({ db } as any, ai);
  (repo as any).db = db;
  return { repo, db, ai };
};

const makeStmt = (opts: { get?: any; all?: any; run?: any } = {}) => ({
  get: vi.fn().mockReturnValue(opts.get ?? null),
  all: vi.fn().mockReturnValue(opts.all ?? []),
  run: vi.fn().mockReturnValue(opts.run ?? { lastInsertRowid: 1 }),
});

// Filtri completamente vuoti
const emptyFilters: SearchFilters = {
  common: {
    chiaveDescrittiva: null,
    classificazione: null,
    conservazione: null,
    note: null,
    tipoDocumento: null,
  },
  diDai: {
    nome: null,
    versione: null,
    idPrimario: null,
    tipologia: null,
    modalitaFormazione: null,
    riservatezza: null,
    identificativoFormato: null,
    verifica: null,
    registrazione: null,
    tracciatureModifiche: null,
  },
  aggregate: {
    tipoAggregazione: null,
    idAggregazione: null,
    tipoFascicolo: null,
    dataApertura: null,
    dataChiusura: null,
    procedimento: null,
    assegnazione: null,
  },
  subject: null,
  custom: null,
};

const fakeRow = {
  id: 1,
  uuid: "doc-uuid",
  integrityStatus: "UNKNOWN",
  processId: 1,
};

// ─── searchDocument — filtri vuoti ───────────────────────────────────────────

describe("DocumentRepository.searchDocument — filtri vuoti", () => {
  it("ritorna array vuoto senza interrogare il DB se tutti i filtri sono null", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);

    const results = repo.searchDocument(emptyFilters);

    expect(results).toEqual([]);
    expect(db.prepare).toHaveBeenCalledTimes(0);
  });
});

// ─── searchDocument — filtri common ──────────────────────────────────────────

describe("DocumentRepository.searchDocument — filtri common", () => {
  it("filtra per TipologiaDocumentale — genera condizione EXISTS su document_metadata", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const filters: SearchFilters = {
      ...emptyFilters,
      common: {
        ...emptyFilters.common,
        tipoDocumento: DocumentType.DOCUMENTO_INFORMATICO,
      },
    };

    repo.searchDocument(filters);

    const sql = db.prepare.mock.calls[0][0] as string;
    expect(sql).toContain("EXISTS");
    expect(sql).toContain("document_metadata");
  });

  it("filtra per TipologiaDocumentale — passa la chiave corretta", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const filters: SearchFilters = {
      ...emptyFilters,
      common: {
        ...emptyFilters.common,
        tipoDocumento: DocumentType.DOCUMENTO_INFORMATICO,
      },
    };

    repo.searchDocument(filters);

    const callArgs = db.prepare.mock.results[0].value.all.mock
      .calls[0] as string[];
    expect(callArgs).toContain("TipologiaDocumentale");
    expect(callArgs).toContain("DOCUMENTO INFORMATICO");
  });

  it("filtra per Note", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const filters: SearchFilters = {
      ...emptyFilters,
      common: { ...emptyFilters.common, note: "nota importante" },
    };

    repo.searchDocument(filters);

    const callArgs = db.prepare.mock.results[0].value.all.mock
      .calls[0] as string[];
    expect(callArgs).toContain("Note");
    expect(callArgs).toContain("nota importante");
  });

  it("filtra per ChiaveDescrittiva (chiaveDescrittiva.oggetto)", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const filters: SearchFilters = {
      ...emptyFilters,
      common: {
        ...emptyFilters.common,
        chiaveDescrittiva: { oggetto: "contratto vendita", paroleChiave: null },
      },
    };

    repo.searchDocument(filters);

    const callArgs = db.prepare.mock.results[0].value.all.mock
      .calls[0] as string[];
    expect(callArgs).toContain("ChiaveDescrittiva");
    expect(callArgs).toContain("contratto vendita");
  });

  it("filtra per ParoleChiave (chiaveDescrittiva.paroleChiave)", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const filters: SearchFilters = {
      ...emptyFilters,
      common: {
        ...emptyFilters.common,
        chiaveDescrittiva: { oggetto: null, paroleChiave: "fattura IVA" },
      },
    };

    repo.searchDocument(filters);

    const callArgs = db.prepare.mock.results[0].value.all.mock
      .calls[0] as string[];
    expect(callArgs).toContain("ParoleChiave");
    expect(callArgs).toContain("fattura IVA");
  });

  it("filtra per IndiceDiClassificazione (classificazione.codice)", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const filters: SearchFilters = {
      ...emptyFilters,
      common: {
        ...emptyFilters.common,
        classificazione: { codice: "1.2.3", descrizione: null },
      },
    };

    repo.searchDocument(filters);

    const callArgs = db.prepare.mock.results[0].value.all.mock
      .calls[0] as string[];
    expect(callArgs).toContain("IndiceDiClassificazione");
    expect(callArgs).toContain("1.2.3");
  });

  it("filtra per Descrizione (classificazione.descrizione)", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const filters: SearchFilters = {
      ...emptyFilters,
      common: {
        ...emptyFilters.common,
        classificazione: { codice: null, descrizione: "Contratti attivi" },
      },
    };

    repo.searchDocument(filters);

    const callArgs = db.prepare.mock.results[0].value.all.mock
      .calls[0] as string[];
    expect(callArgs).toContain("Descrizione");
    expect(callArgs).toContain("Contratti attivi");
  });

  it("filtra per TempoDiConservazione (conservazione.valore)", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const filters: SearchFilters = {
      ...emptyFilters,
      common: {
        ...emptyFilters.common,
        conservazione: { valore: 10 },
      },
    };

    repo.searchDocument(filters);

    const callArgs = db.prepare.mock.results[0].value.all.mock
      .calls[0] as string[];
    expect(callArgs).toContain("TempoDiConservazione");
    expect(callArgs).toContain("10");
  });

  it("filtra per più campi common contemporaneamente — genera più EXISTS", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const filters: SearchFilters = {
      ...emptyFilters,
      common: {
        tipoDocumento: DocumentType.DOCUMENTO_INFORMATICO,
        note: "nota test",
        chiaveDescrittiva: null,
        classificazione: null,
        conservazione: null,
      },
    };

    repo.searchDocument(filters);

    const sql = db.prepare.mock.calls[0][0] as string;
    const existsCount = (sql.match(/EXISTS/g) ?? []).length;
    expect(existsCount).toBe(2);
  });
});

// ─── searchDocument — filtri diDai ───────────────────────────────────────────

describe("DocumentRepository.searchDocument — filtri diDai", () => {
  it("filtra per NomeDelDocumento", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const filters: SearchFilters = {
      ...emptyFilters,
      diDai: { ...emptyFilters.diDai, nome: "fattura.pdf" },
    };

    repo.searchDocument(filters);

    const callArgs = db.prepare.mock.results[0].value.all.mock
      .calls[0] as string[];
    expect(callArgs).toContain("NomeDelDocumento");
    expect(callArgs).toContain("fattura.pdf");
  });

  it("filtra per VersioneDelDocumento", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const filters: SearchFilters = {
      ...emptyFilters,
      diDai: { ...emptyFilters.diDai, versione: "2.0" },
    };

    repo.searchDocument(filters);

    const callArgs = db.prepare.mock.results[0].value.all.mock
      .calls[0] as string[];
    expect(callArgs).toContain("VersioneDelDocumento");
    expect(callArgs).toContain("2.0");
  });

  it("filtra per IdIdentificativoDocumentoPrimario", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const filters: SearchFilters = {
      ...emptyFilters,
      diDai: { ...emptyFilters.diDai, idPrimario: "ID-2026-001" },
    };

    repo.searchDocument(filters);

    const callArgs = db.prepare.mock.results[0].value.all.mock
      .calls[0] as string[];
    expect(callArgs).toContain("IdIdentificativoDocumentoPrimario");
    expect(callArgs).toContain("ID-2026-001");
  });

  it("filtra per ModalitaDiFormazione", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const filters: SearchFilters = {
      ...emptyFilters,
      diDai: {
        ...emptyFilters.diDai,
        modalitaFormazione: DIDAIFormation.EX_NOVO,
      },
    };

    repo.searchDocument(filters);

    const callArgs = db.prepare.mock.results[0].value.all.mock
      .calls[0] as string[];
    expect(callArgs).toContain("ModalitaDiFormazione");
    expect(callArgs).toContain(DIDAIFormation.EX_NOVO);
  });

  it("filtra per Riservato (riservatezza)", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const filters: SearchFilters = {
      ...emptyFilters,
      diDai: { ...emptyFilters.diDai, riservatezza: true },
    };

    repo.searchDocument(filters);

    const callArgs = db.prepare.mock.results[0].value.all.mock
      .calls[0] as string[];
    expect(callArgs).toContain("Riservato");
    expect(callArgs).toContain("true");
  });

  it("filtra per Formato (identificativoFormato.formato)", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const filters: SearchFilters = {
      ...emptyFilters,
      diDai: {
        ...emptyFilters.diDai,
        identificativoFormato: {
          formato: AGIDFormats.PDF,
          nomeProdottoCreazione: null,
          versioneProdottoCreazione: null,
          produttoreProdottoCreazione: null,
        },
      },
    };

    repo.searchDocument(filters);

    const callArgs = db.prepare.mock.results[0].value.all.mock
      .calls[0] as string[];
    expect(callArgs).toContain("Formato");
    expect(callArgs).toContain("PDF");
  });

  it("filtra per NomeProdotto (identificativoFormato.nomeProdottoCreazione)", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const filters: SearchFilters = {
      ...emptyFilters,
      diDai: {
        ...emptyFilters.diDai,
        identificativoFormato: {
          formato: null,
          nomeProdottoCreazione: "Adobe Acrobat",
          versioneProdottoCreazione: null,
          produttoreProdottoCreazione: null,
        },
      },
    };

    repo.searchDocument(filters);

    const callArgs = db.prepare.mock.results[0].value.all.mock
      .calls[0] as string[];
    expect(callArgs).toContain("NomeProdotto");
    expect(callArgs).toContain("Adobe Acrobat");
  });

  it("filtra per VersioneProdotto (identificativoFormato.versioneProdottoCreazione)", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const filters: SearchFilters = {
      ...emptyFilters,
      diDai: {
        ...emptyFilters.diDai,
        identificativoFormato: {
          formato: null,
          nomeProdottoCreazione: null,
          versioneProdottoCreazione: "11.0",
          produttoreProdottoCreazione: null,
        },
      },
    };

    repo.searchDocument(filters);

    const callArgs = db.prepare.mock.results[0].value.all.mock
      .calls[0] as string[];
    expect(callArgs).toContain("VersioneProdotto");
    expect(callArgs).toContain("11.0");
  });

  it("filtra per Produttore (identificativoFormato.produttoreProdottoCreazione)", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const filters: SearchFilters = {
      ...emptyFilters,
      diDai: {
        ...emptyFilters.diDai,
        identificativoFormato: {
          formato: null,
          nomeProdottoCreazione: null,
          versioneProdottoCreazione: null,
          produttoreProdottoCreazione: "Adobe Systems",
        },
      },
    };

    repo.searchDocument(filters);

    const callArgs = db.prepare.mock.results[0].value.all.mock
      .calls[0] as string[];
    expect(callArgs).toContain("Produttore");
    expect(callArgs).toContain("Adobe Systems");
  });

  it("filtra per FirmatoDigitalmente (verifica.formatoDigitalmente)", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const filters: SearchFilters = {
      ...emptyFilters,
      diDai: {
        ...emptyFilters.diDai,
        verifica: {
          formatoDigitalmente: true,
          sigillatoElettr: null,
          marcaturaTemporale: null,
          conformitaCopie: null,
        },
      },
    };

    repo.searchDocument(filters);

    const callArgs = db.prepare.mock.results[0].value.all.mock
      .calls[0] as string[];
    expect(callArgs).toContain("FirmatoDigitalmente");
    expect(callArgs).toContain("true");
  });

  it("filtra per SigillatoElettronicamente (verifica.sigillatoElettr)", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const filters: SearchFilters = {
      ...emptyFilters,
      diDai: {
        ...emptyFilters.diDai,
        verifica: {
          formatoDigitalmente: null,
          sigillatoElettr: true,
          marcaturaTemporale: null,
          conformitaCopie: null,
        },
      },
    };

    repo.searchDocument(filters);

    const callArgs = db.prepare.mock.results[0].value.all.mock
      .calls[0] as string[];
    expect(callArgs).toContain("SigillatoElettronicamente");
    expect(callArgs).toContain("true");
  });

  it("filtra per MarcaturaTemporale (verifica.marcaturaTemporale)", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const filters: SearchFilters = {
      ...emptyFilters,
      diDai: {
        ...emptyFilters.diDai,
        verifica: {
          formatoDigitalmente: null,
          sigillatoElettr: null,
          marcaturaTemporale: true,
          conformitaCopie: null,
        },
      },
    };

    repo.searchDocument(filters);

    const callArgs = db.prepare.mock.results[0].value.all.mock
      .calls[0] as string[];
    expect(callArgs).toContain("MarcaturaTemporale");
    expect(callArgs).toContain("true");
  });

  it("filtra per ConformitaCopieImmagineSuSupportoInformatico (verifica.conformitaCopie)", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const filters: SearchFilters = {
      ...emptyFilters,
      diDai: {
        ...emptyFilters.diDai,
        verifica: {
          formatoDigitalmente: null,
          sigillatoElettr: null,
          marcaturaTemporale: null,
          conformitaCopie: true,
        },
      },
    };

    repo.searchDocument(filters);

    const callArgs = db.prepare.mock.results[0].value.all.mock
      .calls[0] as string[];
    expect(callArgs).toContain("ConformitaCopieImmagineSuSupportoInformatico");
    expect(callArgs).toContain("true");
  });

  it("filtra per TipologiaDiFlusso (registrazione.tipologiaFlusso)", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const filters: SearchFilters = {
      ...emptyFilters,
      diDai: {
        ...emptyFilters.diDai,
        registrazione: {
          tipologiaFlusso: FlowType.ENTRATA,
          tipologiaRegistro: null,
          dataRegistrazione: null,
          oraRegistrazione: null,
          numeroRegistrazione: null,
          codiceRegistro: null,
        },
      },
    };

    repo.searchDocument(filters);

    const callArgs = db.prepare.mock.results[0].value.all.mock
      .calls[0] as string[];
    expect(callArgs).toContain("TipologiaDiFlusso");
    expect(callArgs).toContain("ENTRATA");
  });

  it("filtra per TipoRegistro (registrazione.tipologiaRegistro)", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const filters: SearchFilters = {
      ...emptyFilters,
      diDai: {
        ...emptyFilters.diDai,
        registrazione: {
          tipologiaFlusso: null,
          tipologiaRegistro: RegisterType.PROTOCOLLO,
          dataRegistrazione: null,
          oraRegistrazione: null,
          numeroRegistrazione: null,
          codiceRegistro: null,
        },
      },
    };

    repo.searchDocument(filters);

    const callArgs = db.prepare.mock.results[0].value.all.mock
      .calls[0] as string[];
    expect(callArgs).toContain("TipoRegistro");
    expect(callArgs).toContain(RegisterType.PROTOCOLLO);
  });

  it("filtra per NumeroRegistrazioneDocumento (registrazione.numeroRegistrazione)", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const filters: SearchFilters = {
      ...emptyFilters,
      diDai: {
        ...emptyFilters.diDai,
        registrazione: {
          tipologiaFlusso: null,
          tipologiaRegistro: null,
          dataRegistrazione: null,
          oraRegistrazione: null,
          numeroRegistrazione: 42,
          codiceRegistro: null,
        },
      },
    };

    repo.searchDocument(filters);

    const callArgs = db.prepare.mock.results[0].value.all.mock
      .calls[0] as string[];
    expect(callArgs).toContain("NumeroRegistrazioneDocumento");
    expect(callArgs).toContain("42");
  });

  it("filtra per CodiceRegistro (registrazione.codiceRegistro)", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const filters: SearchFilters = {
      ...emptyFilters,
      diDai: {
        ...emptyFilters.diDai,
        registrazione: {
          tipologiaFlusso: null,
          tipologiaRegistro: null,
          dataRegistrazione: null,
          oraRegistrazione: null,
          numeroRegistrazione: null,
          codiceRegistro: "REG-2026",
        },
      },
    };

    repo.searchDocument(filters);

    const callArgs = db.prepare.mock.results[0].value.all.mock
      .calls[0] as string[];
    expect(callArgs).toContain("CodiceRegistro");
    expect(callArgs).toContain("REG-2026");
  });

  // dataRegistrazione e oraRegistrazione non sono mappate con certezza —
  // da allineare col team prima di aggiungere i test
});

// ─── searchDocument — filtri aggregate ───────────────────────────────────────

describe("DocumentRepository.searchDocument — filtri aggregate", () => {
  it("filtra per TipoAggregazione", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const filters: SearchFilters = {
      ...emptyFilters,
      aggregate: {
        ...emptyFilters.aggregate,
        tipoAggregazione: AggregationType.FASCICOLO,
      },
    };

    repo.searchDocument(filters);

    const callArgs = db.prepare.mock.results[0].value.all.mock
      .calls[0] as string[];
    expect(callArgs).toContain("TipoAggregazione");
    expect(callArgs).toContain("FASCICOLO");
  });

  it("filtra per IdAggregazione", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const filters: SearchFilters = {
      ...emptyFilters,
      aggregate: { ...emptyFilters.aggregate, idAggregazione: "AGG-2026-001" },
    };

    repo.searchDocument(filters);

    const callArgs = db.prepare.mock.results[0].value.all.mock
      .calls[0] as string[];
    expect(callArgs).toContain("IdAggregazione");
    expect(callArgs).toContain("AGG-2026-001");
  });

  it("filtra per TipoAgg (tipoFascicolo)", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const filters: SearchFilters = {
      ...emptyFilters,
      aggregate: {
        ...emptyFilters.aggregate,
        tipoFascicolo: FascicoloType.AFFARE,
      },
    };

    repo.searchDocument(filters);

    const callArgs = db.prepare.mock.results[0].value.all.mock
      .calls[0] as string[];
    expect(callArgs).toContain("TipoAgg");
    expect(callArgs).toContain("AFFARE");
  });

  it("filtra per Oggetto (procedimento.materia)", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const filters: SearchFilters = {
      ...emptyFilters,
      aggregate: {
        ...emptyFilters.aggregate,
        procedimento: {
          materia: "Appalti pubblici",
          denominazioneProcedimento: null,
          URICatalogo: null,
          fasi: null,
        },
      },
    };

    repo.searchDocument(filters);

    const callArgs = db.prepare.mock.results[0].value.all.mock
      .calls[0] as string[];
    expect(callArgs).toContain("Oggetto");
    expect(callArgs).toContain("Appalti pubblici");
  });

  it("filtra per Denominazione (procedimento.denominazioneProcedimento)", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const filters: SearchFilters = {
      ...emptyFilters,
      aggregate: {
        ...emptyFilters.aggregate,
        procedimento: {
          materia: null,
          denominazioneProcedimento: "Procedimento appalto lavori",
          URICatalogo: null,
          fasi: null,
        },
      },
    };

    repo.searchDocument(filters);

    const callArgs = db.prepare.mock.results[0].value.all.mock
      .calls[0] as string[];
    expect(callArgs).toContain("Denominazione");
    expect(callArgs).toContain("Procedimento appalto lavori");
  });

  it("filtra per TipoRuolo (assegnazione.tipoAssegnazione)", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const filters: SearchFilters = {
      ...emptyFilters,
      aggregate: {
        ...emptyFilters.aggregate,
        assegnazione: {
          tipoAssegnazione: AssegnazioneType.COMPETENZA,
          soggettoAssegn: null,
          dataInizioAssegn: null,
          dataFineAssegn: null,
        },
      },
    };

    repo.searchDocument(filters);

    const callArgs = db.prepare.mock.results[0].value.all.mock
      .calls[0] as string[];
    expect(callArgs).toContain("TipoRuolo");
    expect(callArgs).toContain("PER COMPETENZA");
  });

  // dataApertura, dataChiusura, dataInizioAssegn, dataFineAssegn —
  // mapping ambiguo con i metadati disponibili, da allineare col team
});

// ─── searchDocument — filtri custom ──────────────────────────────────────────

describe("DocumentRepository.searchDocument — filtri custom", () => {
  it("filtra per campo custom con chiave e valore arbitrari", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const filters: SearchFilters = {
      ...emptyFilters,
      custom: { field: "Allegati", value: "documento_allegato.pdf" },
    };

    repo.searchDocument(filters);

    const callArgs = db.prepare.mock.results[0].value.all.mock
      .calls[0] as string[];
    expect(callArgs).toContain("Allegati");
    expect(callArgs).toContain("documento_allegato.pdf");
  });

  it("filtra per campo custom Impronta", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const filters: SearchFilters = {
      ...emptyFilters,
      custom: { field: "Impronta", value: "sha256:abc123" },
    };

    repo.searchDocument(filters);

    const callArgs = db.prepare.mock.results[0].value.all.mock
      .calls[0] as string[];
    expect(callArgs).toContain("Impronta");
    expect(callArgs).toContain("sha256:abc123");
  });

  it("ignora filtro custom se value è null", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);

    const filters: SearchFilters = {
      ...emptyFilters,
      custom: { field: "Allegati", value: null },
    };

    const results = repo.searchDocument(filters);
    expect(results).toEqual([]);
    expect(db.prepare).toHaveBeenCalledTimes(0);
  });
});

// ─── searchDocument — filtri combinati ───────────────────────────────────────

describe("DocumentRepository.searchDocument — filtri combinati", () => {
  it("combina TipologiaDocumentale + NomeDelDocumento — genera EXISTS per entrambi", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const filters: SearchFilters = {
      ...emptyFilters,
      common: {
        ...emptyFilters.common,
        tipoDocumento: DocumentType.DOCUMENTO_INFORMATICO,
      },
      diDai: { ...emptyFilters.diDai, nome: "contratto.pdf" },
    };

    repo.searchDocument(filters);

    const callArgs = db.prepare.mock.results[0].value.all.mock
      .calls[0] as string[];
    expect(callArgs).toContain("TipologiaDocumentale");
    expect(callArgs).toContain("NomeDelDocumento");
  });

  it("combina NomeDelDocumento + TipoAggregazione", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const filters: SearchFilters = {
      ...emptyFilters,
      diDai: { ...emptyFilters.diDai, nome: "verbale.pdf" },
      aggregate: {
        ...emptyFilters.aggregate,
        tipoAggregazione: AggregationType.FASCICOLO,
      },
    };

    repo.searchDocument(filters);

    const callArgs = db.prepare.mock.results[0].value.all.mock
      .calls[0] as string[];
    expect(callArgs).toContain("NomeDelDocumento");
    expect(callArgs).toContain("TipoAggregazione");
  });

  it("combina Formato + Riservato + TipologiaDiFlusso — genera tre EXISTS", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const filters: SearchFilters = {
      ...emptyFilters,
      diDai: {
        ...emptyFilters.diDai,
        riservatezza: true,
        identificativoFormato: {
          formato: AGIDFormats.PDF,
          nomeProdottoCreazione: null,
          versioneProdottoCreazione: null,
          produttoreProdottoCreazione: null,
        },
        registrazione: {
          tipologiaFlusso: FlowType.ENTRATA,
          tipologiaRegistro: null,
          dataRegistrazione: null,
          oraRegistrazione: null,
          numeroRegistrazione: null,
          codiceRegistro: null,
        },
      },
    };

    repo.searchDocument(filters);

    const sql = db.prepare.mock.calls[0][0] as string;
    const existsCount = (sql.match(/EXISTS/g) ?? []).length;
    expect(existsCount).toBe(3);

    const callArgs = db.prepare.mock.results[0].value.all.mock
      .calls[0] as string[];
    expect(callArgs).toContain("Formato");
    expect(callArgs).toContain("Riservato");
    expect(callArgs).toContain("TipologiaDiFlusso");
  });

  it("combina Note + IdAggregazione + campo custom Impronta", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const filters: SearchFilters = {
      common: { ...emptyFilters.common, note: "nota urgente" },
      diDai: { ...emptyFilters.diDai },
      aggregate: { ...emptyFilters.aggregate, idAggregazione: "AGG-001" },
      subject: null,
      custom: { field: "Impronta", value: "sha256:xyz" },
    };

    repo.searchDocument(filters);

    const callArgs = db.prepare.mock.results[0].value.all.mock
      .calls[0] as string[];
    expect(callArgs).toContain("Note");
    expect(callArgs).toContain("IdAggregazione");
    expect(callArgs).toContain("Impronta");
  });

  it("combina tutti i gruppi — common + diDai + aggregate + custom", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const filters: SearchFilters = {
      common: {
        ...emptyFilters.common,
        note: "nota",
        tipoDocumento: DocumentType.DOCUMENTO_INFORMATICO,
      },
      diDai: { ...emptyFilters.diDai, nome: "doc.pdf", versione: "1.0" },
      aggregate: {
        ...emptyFilters.aggregate,
        tipoAggregazione: AggregationType.FASCICOLO,
        idAggregazione: "AGG-001",
      },
      subject: null,
      custom: { field: "Allegati", value: "allegato.pdf" },
    };

    repo.searchDocument(filters);

    const callArgs = db.prepare.mock.results[0].value.all.mock
      .calls[0] as string[];
    expect(callArgs).toContain("Note");
    expect(callArgs).toContain("TipologiaDocumentale");
    expect(callArgs).toContain("NomeDelDocumento");
    expect(callArgs).toContain("VersioneDelDocumento");
    expect(callArgs).toContain("TipoAggregazione");
    expect(callArgs).toContain("IdAggregazione");
    expect(callArgs).toContain("Allegati");

    const sql = db.prepare.mock.calls[0][0] as string;
    const existsCount = (sql.match(/EXISTS/g) ?? []).length;
    expect(existsCount).toBe(7);
  });
});

// ─── getIndexedDocumentsCount ─────────────────────────────────────────────────

describe("DocumentRepository.getIndexedDocumentsCount", () => {
  it("ritorna il conteggio dalla tabella vss_documents", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ get: { count: 42 } }));

    const count = repo.getIndexedDocumentsCount();

    expect(count).toBe(42);
  });

  it("ritorna 0 se la tabella è vuota", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ get: { count: 0 } }));

    const count = repo.getIndexedDocumentsCount();

    expect(count).toBe(0);
  });

  it("ritorna 0 se la query non ritorna righe", () => {
    const db = makeDb();
    const { repo } = makeRepo(db);
    db.prepare.mockReturnValue(makeStmt({ get: undefined }));

    const count = repo.getIndexedDocumentsCount();

    expect(count).toBe(0);
  });
});

// ─── toBuffer ────────────────────────────────────────────────────────────────

describe("DocumentRepository.toBuffer (private via searchDocumentSemantic)", () => {
  it("converte Float32Array in Buffer con gli stessi byte", async () => {
    const vector = new Float32Array([0.1, 0.2, 0.3, 0.4]);
    const ai = makeAiAdapter(vector);
    const db = makeDb();
    const { repo } = makeRepo(db, ai);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    await repo.searchDocumentSemantic("test");

    const bufferArg = db.prepare.mock.results[0].value.all.mock
      .calls[0][0] as Buffer;
    expect(Buffer.isBuffer(bufferArg)).toBe(true);
    expect(bufferArg.byteLength).toBe(vector.byteLength);

    const recovered = new Float32Array(
      bufferArg.buffer,
      bufferArg.byteOffset,
      bufferArg.byteLength / 4,
    );
    expect(recovered[0]).toBeCloseTo(0.1, 5);
    expect(recovered[1]).toBeCloseTo(0.2, 5);
  });

  it("il buffer ha esattamente 384 * 4 = 1536 byte", async () => {
    const vector = new Float32Array(384).fill(0.5);
    const ai = makeAiAdapter(vector);
    const db = makeDb();
    const { repo } = makeRepo(db, ai);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    await repo.searchDocumentSemantic("test 384");

    const bufferArg = db.prepare.mock.results[0].value.all.mock
      .calls[0][0] as Buffer;
    expect(bufferArg.byteLength).toBe(384 * 4);
  });
});

// ─── searchDocumentSemantic ───────────────────────────────────────────────────

describe("DocumentRepository.searchDocumentSemantic", () => {
  it("genera embedding dalla query e lo passa a sqlite-vss", async () => {
    const ai = makeAiAdapter();
    const db = makeDb();
    const { repo } = makeRepo(db, ai);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    await repo.searchDocumentSemantic("query test");

    expect(ai.generateEmbedding).toHaveBeenCalledWith("query test");
  });

  it("ritorna array vuoto se vss_documents non ha risultati", async () => {
    const ai = makeAiAdapter();
    const db = makeDb();
    const { repo } = makeRepo(db, ai);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    const results = await repo.searchDocumentSemantic("query senza risultati");

    expect(results).toEqual([]);
  });

  it("calcola score come 1 - distance", async () => {
    const ai = makeAiAdapter();
    const db = makeDb();
    const { repo } = makeRepo(db, ai);

    const vssStmt = makeStmt({ all: [{ rowid: 1, distance: 0.3 }] });
    const docStmt = makeStmt({ get: fakeRow });
    const metaStmt = makeStmt({ all: [] });

    db.prepare
      .mockReturnValueOnce(vssStmt)
      .mockReturnValueOnce(docStmt)
      .mockReturnValueOnce(metaStmt);

    const results = await repo.searchDocumentSemantic("query");

    expect(results).toHaveLength(1);
    expect(results[0].score).toBeCloseTo(0.7, 5);
  });

  it("filtra i documenti non trovati da getById (null safety)", async () => {
    const ai = makeAiAdapter();
    const db = makeDb();
    const { repo } = makeRepo(db, ai);

    const vssStmt = makeStmt({
      all: [
        { rowid: 1, distance: 0.1 },
        { rowid: 99, distance: 0.2 },
      ],
    });
    const docStmt1 = makeStmt({ get: fakeRow });
    const metaStmt = makeStmt({ all: [] });
    const docStmt2 = makeStmt({ get: null });

    db.prepare
      .mockReturnValueOnce(vssStmt)
      .mockReturnValueOnce(docStmt1)
      .mockReturnValueOnce(metaStmt)
      .mockReturnValueOnce(docStmt2);

    const results = await repo.searchDocumentSemantic("query");

    expect(results).toHaveLength(1);
    expect(results[0].document.getUuid()).toBe("doc-uuid");
  });

  it("passa il limite di 10 risultati a sqlite-vss", async () => {
    const ai = makeAiAdapter();
    const db = makeDb();
    const { repo } = makeRepo(db, ai);
    db.prepare.mockReturnValue(makeStmt({ all: [] }));

    await repo.searchDocumentSemantic("query");

    const callArgs = db.prepare.mock.results[0].value.all.mock.calls[0];
    expect(callArgs[1]).toBe(10);
  });
});
