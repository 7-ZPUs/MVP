import { expect, Locator, Page } from '@playwright/test';

export class AdministrativeProceduresPage {
  constructor(private readonly page: Page) {}

  get aggregateHeading(): Locator {
    return this.page.getByTestId('aggregate-metadata-heading');
  }

  get adminProcedureHeading(): Locator {
    return this.page.getByTestId('admin-procedure-heading');
  }

  get documentIndexHeading(): Locator {
    return this.page.getByTestId('document-index-heading');
  }

  get tipoAggregazione(): Locator {
    return this.page.getByTestId('aggregate-row-tipo-aggregazione');
  }

  get idAggregazione(): Locator {
    return this.page.getByTestId('aggregate-row-id-aggregazione');
  }

  get tipologiaFascicolo(): Locator {
    return this.page.getByTestId('aggregate-row-tipologia-fascicolo');
  }

  get tipoAssegnazione(): Locator {
    return this.page.getByTestId('aggregate-row-tipo-assegnazione');
  }

  get soggettoAssegnatario(): Locator {
    return this.page.getByTestId('aggregate-row-soggetto-assegnatario');
  }

  get dataInizioAssegnazione(): Locator {
    return this.page.getByTestId('aggregate-row-data-inizio-assegnazione');
  }

  get dataFineAssegnazione(): Locator {
    return this.page.getByTestId('aggregate-row-data-fine-assegnazione');
  }

  get dataApertura(): Locator {
    return this.page.getByTestId('aggregate-row-data-apertura');
  }

  get dataChiusura(): Locator {
    return this.page.getByTestId('aggregate-row-data-chiusura');
  }

  get progressivo(): Locator {
    return this.page.getByTestId('aggregate-row-progressivo');
  }

  get posizioneFisica(): Locator {
    return this.page.getByTestId('aggregate-row-posizione-fisica');
  }

  get idAggregazionePrimaria(): Locator {
    return this.page.getByTestId('aggregate-row-id-aggregazione-primaria');
  }

  get tempoConservazione(): Locator {
    return this.page.getByTestId('aggregate-row-tempo-conservazione');
  }

  get procedimentoDenominazione(): Locator {
    return this.page.getByTestId('admin-procedure-row-denominazione');
  }

  get procedimentoIndiceUri(): Locator {
    return this.page.getByTestId('admin-procedure-row-indice-uri');
  }

  phase(index: number): Locator {
    return this.page.getByTestId(`admin-procedure-phase-${index}`);
  }

  phaseType(index: number): Locator {
    return this.phase(index).getByTestId('admin-procedure-phase-type');
  }

  phaseDates(index: number): Locator {
    return this.phase(index).getByTestId('admin-procedure-phase-dates');
  }

  get phasesEmpty(): Locator {
    return this.page.getByTestId('admin-procedure-phases-empty');
  }

  documentIndexRow(index: number): Locator {
    return this.page.getByTestId(`document-index-row-${index}`);
  }

  documentIndexType(index: number): Locator {
    return this.documentIndexRow(index).getByTestId('document-index-row-tipo');
  }

  documentIndexIdentifier(index: number): Locator {
    return this.documentIndexRow(index).getByTestId('document-index-row-identificativo');
  }

  get documentIndexEmpty(): Locator {
    return this.page.getByTestId('document-index-empty');
  }

  async openAggregateDetail(aggregateId = '501'): Promise<void> {
    await this.page.goto(`/#/detail/AGGREGATE/${aggregateId}`);
    await expect(this.aggregateHeading).toBeVisible();
  }
}
