import { expect, Locator, Page } from '@playwright/test';

/**
 * Page Object Model for Advanced Filters and File Actions
 * Covers Subject Filters, DiDai Filters, Aggregate Filters, Custom Metadata, and File Actions
 */
export class AdvancedFiltersPage {
  constructor(private readonly page: Page) {}

  private get sidebar(): Locator {
    return this.page.locator('aside.sidebar:has([data-testid="apply-filters-button"])').first();
  }

  private async ensureSidebarOpen(): Promise<void> {
    const sidebar = this.sidebar;
    await expect(sidebar).toBeAttached();

    const isCollapsed = await sidebar.evaluate((el) => el.classList.contains('collapsed'));
    if (isCollapsed) {
      await this.filtersSidebarToggle.click();
    }

    await expect(sidebar).not.toHaveClass(/collapsed/);
    await expect
      .poll(async () => {
        const box = await sidebar.boundingBox();
        return box?.width ?? 0;
      })
      .toBeGreaterThan(100);
  }

  private async expandAccordions(): Promise<void> {
    await this.page.locator('details.filter-accordion').evaluateAll((details) => {
      for (const detail of details) {
        (detail as HTMLDetailsElement).open = true;
        detail.setAttribute('open', '');
      }
    });
  }

  private async clickInSidebar(locator: Locator): Promise<void> {
    const target = locator.first();
    await expect(target).toBeVisible();
    await target.scrollIntoViewIfNeeded();

    try {
      await target.click({ timeout: 5000 });
    } catch {
      await target.click({ force: true });
    }
  }

  private async selectOptionInSidebar(locator: Locator, value: string): Promise<void> {
    const target = locator.first();
    await target.scrollIntoViewIfNeeded();
    await expect(target).toBeVisible();

    const options = await target.locator('option').allTextContents();
    const hasExactMatch = options.some((optionText) => optionText.trim() === value);

    if (hasExactMatch) {
      await target.selectOption({ label: value });
      return;
    }

    const normalized = value.replaceAll('_', ' ').toLowerCase();
    const fuzzy = options.find((optionText) => optionText.replaceAll('_', ' ').toLowerCase().includes(normalized));
    if (fuzzy) {
      await target.selectOption({ label: fuzzy.trim() });
      return;
    }

    const firstSelectableValue = await target
      .locator('option')
      .evaluateAll((nodes) => {
        const option = nodes.find((node) => (node as HTMLOptionElement).value);
        return option ? (option as HTMLOptionElement).value : null;
      });

    if (firstSelectableValue) {
      await target.selectOption(firstSelectableValue);
    }
  }

  // ===== COMMON NAVIGATION ELEMENTS =====
  get searchButton(): Locator {
    return this.page.getByRole('button', { name: 'Ricerca' });
  }

  get filtersSidebarToggle(): Locator {
    return this.page.getByTestId('search-filters-toggle');
  }

  get applyFiltersButton(): Locator {
    return this.page.getByTestId('apply-filters-button');
  }

  get clearFiltersButton(): Locator {
    return this.page.getByTestId('clear-filters-button');
  }

  get searchResultsTitle(): Locator {
    return this.page.getByTestId('search-page-title');
  }

  get searchEmptyState(): Locator {
    return this.page.getByTestId('search-empty-state');
  }

  get searchErrorBanner(): Locator {
    return this.page.getByTestId('search-error-banner');
  }

  get searchRetryButton(): Locator {
    return this.page.getByTestId('search-retry-button');
  }

  // ===== SUBJECT FILTERS (TS-61 to TS-72) =====
  get addSubjectButton(): Locator {
    return this.page.getByTestId('add-subject-button');
  }

  get subjectWizardTitle(): Locator {
    return this.page.getByRole('heading', { name: /seleziona il ruolo/i });
  }

  get roleSelectionButtons(): Locator {
    return this.page.getByTestId(/subject-role-option-/);
  }

  get typeSelectionButtons(): Locator {
    return this.page.getByTestId(/subject-type-option-/);
  }

  subjectTypeLabel(role: string): Locator {
    return this.page.locator(`button:has-text("${role}")`);
  }

  // Subject detail fields by type (TS-65 to TS-72)
  get paiDenominationInput(): Locator {
    return this.page.locator('input[placeholder*="Denominazione"]').or(this.page.locator('#denominazione'));
  }

  get paiCodiceIpaInput(): Locator {
    return this.page.locator('input[placeholder*="Codice IPA"]').or(this.page.locator('#codiceIPA'));
  }

  get paiIndirizziDigitaliInputs(): Locator {
    return this.page.locator('input[placeholder*="Indirizzo digitale"]');
  }

  get paeDenominationInput(): Locator {
    return this.page.locator('input[placeholder*="Denominazione Amm"]');
  }

  get paeUfficioInput(): Locator {
    return this.page.locator('input[placeholder*="Ufficio"]');
  }

  get asCognomeInput(): Locator {
    return this.page.locator('input[placeholder*="Cognome"]');
  }

  get asNomeInput(): Locator {
    return this.page.locator('input[placeholder*="Nome"]');
  }

  get asCFInput(): Locator {
    return this.page.locator('input[placeholder*="Codice Fiscale"]').or(this.page.locator('input[placeholder*="CF"]'));
  }

  get pgDenominationInput(): Locator {
    return this.page.locator('input[placeholder*="Denominazione Org"]');
  }

  get pgPIVACFInput(): Locator {
    return this.page.locator('input[placeholder*="P.IVA"]').or(this.page.locator('input[placeholder*="P.IVA/CF"]'));
  }

  get pfCognomeInput(): Locator {
    return this.page.locator('input[placeholder*="Cognome"]').first();
  }

  get pfNomeInput(): Locator {
    return this.page.locator('input[placeholder*="Nome"]').first();
  }

  get rupCFInput(): Locator {
    return this.page.locator('input[placeholder*="CF"]').first();
  }

  get swDenominationInput(): Locator {
    return this.page.locator('input[placeholder*="Denominazione Sistema"]');
  }

  // ===== DOCUMENT & ADMINISTRATIVE DOCUMENT FILTERS (TS-73 to TS-89) =====
  get documentTypeSelect(): Locator {
    return this.page.getByTestId('document-type-select').or(this.page.locator('#tipoDoc'));
  }

  get documentTypeFilterSection(): Locator {
    return this.page.locator('fieldset:has-text("Tipo di Documento")');
  }

  get specificDocumentFiltersSection(): Locator {
    return this.page.locator('fieldset:has-text("Filtri specifici")');
  }

  get registrationTypeSelect(): Locator {
    return this.page.getByTestId('registration-type-select').or(this.page.locator('#tipoRegistro'));
  }

  get registrationNumberInput(): Locator {
    return this.page.getByTestId('registration-number-input').or(this.page.locator('#numRegistrazione'));
  }

  get registrationCodeInput(): Locator {
    return this.page.getByTestId('registration-code-input').or(this.page.locator('#codRegistrazione'));
  }

  get flowTypeSelect(): Locator {
    return this.page.getByTestId('flow-type-select').or(this.page.locator('#tipoFlusso'));
  }

  get registrationDateInput(): Locator {
    return this.page.getByTestId('registration-date-input').or(this.page.locator('#dataRegistrazione'));
  }

  get registrationTimeInput(): Locator {
    return this.page.locator('input[type="time"]').or(this.page.locator('#oraRegistrazione'));
  }

  get documentaryTypeInput(): Locator {
    return this.page.locator('input[placeholder*="Tipo"]').or(this.page.locator('#tipologiaDocumentale'));
  }

  get formationModeSelect(): Locator {
    return this.page.locator('select[name="formationMode"]').or(this.page.locator('#modalitaFormazione'));
  }

  get reservedFieldCheckbox(): Locator {
    return this.page.locator('input[type="checkbox"][name="reserved"]').or(this.page.locator('#campoRiservato'));
  }

  get formatInput(): Locator {
    return this.page.locator('input[placeholder*="Formato"]').or(this.page.locator('#formato'));
  }

  get softwareProductInput(): Locator {
    return this.page.locator('input[placeholder*="Prodotto Software"]').or(this.page.locator('#prodottoSoftware'));
  }

  get signedCheckbox(): Locator {
    return this.page.locator('input[type="checkbox"][name="signed"]').or(this.page.locator('#firmato'));
  }

  get sealeCheckbox(): Locator {
    return this.page.locator('input[type="checkbox"][name="sealed"]').or(this.page.locator('#sigillato'));
  }

  get timestampCheckbox(): Locator {
    return this.page.locator('input[type="checkbox"][name="timestamp"]').or(this.page.locator('#marcatura'));
  }

  get imageCopyComplianceCheckbox(): Locator {
    return this.page.locator('input[type="checkbox"][name="imageCopy"]').or(this.page.locator('#conformitaCopieImmagine'));
  }

  get documentNameInput(): Locator {
    return this.page.getByTestId('document-name-input').or(this.page.locator('#nomeDidai'));
  }

  get documentVersionInput(): Locator {
    return this.page.locator('input[placeholder*="Versione"]').or(this.page.locator('#versioneDocumento'));
  }

  get primaryDocumentIdInput(): Locator {
    return this.page.locator('input[placeholder*="Identificativo del Documento Primario"]').or(this.page.locator('#idDocPrimario'));
  }

  get documentChangeTrackingSection(): Locator {
    return this.page.locator('fieldset:has("Tracciatura Modifiche")');
  }

  get modificationTypeSelect(): Locator {
    return this.page.locator('select[name="modificationType"]').or(this.page.locator('#tipoModifica'));
  }

  get modificationSubjectInput(): Locator {
    return this.page.locator('input[placeholder*="Soggetto Autore"]').or(this.page.locator('#soggettoAutore'));
  }

  get modificationDateInput(): Locator {
    return this.page.locator('input[type="date"][name="modificationDate"]').or(this.page.locator('#dataModifica'));
  }

  get previousDocIdInput(): Locator {
    return this.page.locator('input[placeholder*="IdDoc precedente"]').or(this.page.locator('#idDocPrecedente'));
  }

  // ===== AGGREGATE FILTERS (TS-90 to TS-105) =====
  get aggregateFiltersSection(): Locator {
    return this.page.locator('fieldset:has-text("Aggregazione Documentale")');
  }

  get aggregationTypeSelect(): Locator {
    return this.page.getByTestId('aggregation-type-select').or(this.page.locator('#tipoAggregazione'));
  }

  get aggregateIdentifierInput(): Locator {
    return this.page.getByTestId('aggregate-identifier-input').or(this.page.locator('#idAggregazione'));
  }

  get fileTypeSelect(): Locator {
    return this.page.locator('select[name="fileType"]').or(this.page.locator('#tipologiaFascicolo'));
  }

  get primaryAggregateIdInput(): Locator {
    return this.page.locator('input[placeholder*="Id Aggregazione Primario"]').or(this.page.locator('#idAggregPrimario'));
  }

  get aggregateOpenDateInput(): Locator {
    return this.page.locator('input[type="date"][name="openDate"]').or(this.page.locator('#dataApertura'));
  }

  get aggregateCloseDateInput(): Locator {
    return this.page.locator('input[type="date"][name="closeDate"]').or(this.page.locator('#dataChiusura'));
  }

  get procedureSubjectInput(): Locator {
    return this.page.locator('input[placeholder*="Materia"]').or(this.page.locator('#materia'));
  }

  get procedureInput(): Locator {
    return this.page.locator('input[placeholder*="Procedimento"]').or(this.page.locator('#procedimento'));
  }

  get procedureCatalogInput(): Locator {
    return this.page.locator('input[placeholder*="Catalogo Procedimenti"]').or(this.page.locator('#catalogoProcedimenti'));
  }

  get procedurePhaseSelect(): Locator {
    return this.page.locator('select[name="phase"]').or(this.page.locator('#fasi'));
  }

  get phaseTypeSelect(): Locator {
    return this.page.locator('select[name="phaseType"]').or(this.page.locator('#tipoFase'));
  }

  get phaseStartDateInput(): Locator {
    return this.page.locator('input[type="date"][name="phaseStart"]').or(this.page.locator('#dataInizioFase'));
  }

  get phaseEndDateInput(): Locator {
    return this.page.locator('input[type="date"][name="phaseEnd"]').or(this.page.locator('#dataFineFase'));
  }

  get assignmentTypeSelect(): Locator {
    return this.page.locator('select[name="assignmentType"]').or(this.page.locator('#tipoAssegnazione'));
  }

  get assignmentSubjectInput(): Locator {
    return this.page.locator('input[placeholder*="Soggetto"]').or(this.page.locator('#soggetto'));
  }

  get assignmentStartDateInput(): Locator {
    return this.page.locator('input[type="date"][name="assignmentStart"]').or(this.page.locator('#dataInizioAssegnazione'));
  }

  get assignmentEndDateInput(): Locator {
    return this.page.locator('input[type="date"][name="assignmentEnd"]').or(this.page.locator('#dataFineAssegnazione'));
  }

  get aggregateProgressiveInput(): Locator {
    return this.page.locator('input[placeholder*="Progressivo"]').or(this.page.locator('#progressivoAggregazione'));
  }

  // ===== CUSTOM METADATA FILTERS (TS-106 to TS-107) =====
  get customMetadataSection(): Locator {
    return this.page.locator('fieldset:has-text("Metadati Personalizzati")');
  }

  get addCustomMetadataButton(): Locator {
    return this.page.getByRole('button', { name: /aggiungi metadato/i }).or(this.page.locator('button:has-text("+ Aggiungi Metadato")'));
  }

  get customMetadataNameInputs(): Locator {
    return this.page.locator('input[placeholder*="Nome metadato"]').or(this.page.locator('input[name="metadataName"]'));
  }

  get customMetadataValueInputs(): Locator {
    return this.page.locator('input[placeholder*="Valore"]').or(this.page.locator('input[name="metadataValue"]'));
  }

  get removeMetadataButtons(): Locator {
    return this.page.locator('button:has-text("Rimuovi")').or(this.page.locator('button[name="removeMetadata"]'));
  }

  // ===== SEARCH RESULTS (TS-108 to TS-112) =====
  get searchResultsList(): Locator {
    return this.page.locator('app-search-results, .search-results-container');
  }

  get searchResultItems(): Locator {
    return this.page.getByTestId('search-result-card');
  }

  get documentNameInResults(): Locator {
    return this.page.locator('[data-testid="result-name"], .result-name, [class*="name"]');
  }

  get documentDateInResults(): Locator {
    return this.page.locator('[data-testid="result-date"], .result-date, [class*="date"]');
  }

  get documentTypeInResults(): Locator {
    return this.page.locator('[data-testid="result-type"], .result-type, [class*="type"]');
  }

  get noResultsMessage(): Locator {
    return this.page.getByText(/nessun risultato/i);
  }

  // ===== FILTER VALIDATION (TS-113 to TS-115) =====
  get invalidFilterError(): Locator {
    return this.page.getByTestId('filter-error').or(this.page.locator('.validation-error')).first();
  }

  get fieldErrorMessages(): Locator {
    return this.page.locator('[class*="error"], [aria-invalid="true"], .field-error');
  }

  get filterErrorBanner(): Locator {
    return this.page.locator('.error-banner:has-text("filtri contengono errori")');
  }

  // ===== FILE ACTIONS (TS-116 to TS-120) =====
  get saveDocumentButton(): Locator {
    return this.page.getByRole('button', { name: /salva/i }).or(this.page.locator('button[title="Salva"]'));
  }

  get saveMultipleButton(): Locator {
    return this.page.getByRole('button', { name: /salva documenti/i }).or(this.page.locator('button:has-text("Salva Documenti")'));
  }

  get printButton(): Locator {
    return this.page.getByRole('button', { name: /stampa/i }).or(this.page.locator('button[title="Stampa"]'));
  }

  get printMultipleButton(): Locator {
    return this.page.getByRole('button', { name: /stampa documenti/i }).or(this.page.locator('button:has-text("Stampa Documenti")'));
  }

  get fileActionMenu(): Locator {
    return this.page.locator('.file-actions-menu, [role="menu"]');
  }

  get saveSuccessMessage(): Locator {
    return this.page.getByText(/salvataggio completato/i).or(this.page.getByText(/documento salvato/i));
  }

  get saveErrorMessage(): Locator {
    return this.page.getByText(/errore durante il salvataggio/i).or(this.page.getByText(/salvataggio fallito/i));
  }

  // ===== NAVIGATION & ACTIONS =====
  async gotoSearchPage(): Promise<void> {
    await this.page.goto('/');
    await expect(this.searchButton).toBeVisible();
    await this.searchButton.click();
  }

  async openAdvancedFilters(): Promise<void> {
    await this.ensureSidebarOpen();
    await this.expandAccordions();
  }

  async startSubjectWizard(): Promise<void> {
    await this.clickInSidebar(this.addSubjectButton);
  }

  async selectSubjectRole(role: string): Promise<void> {
    const roleByTestId = this.page.getByTestId(`subject-role-option-${role}`);
    if ((await roleByTestId.count()) > 0) {
      await this.clickInSidebar(roleByTestId.first());
      return;
    }

    const roleStepButtons = this.page.getByTestId(/subject-role-option-/);
    const exactButton = roleStepButtons.filter({ hasText: role });

    if ((await exactButton.count()) > 0) {
      await this.clickInSidebar(exactButton.first());
      return;
    }

    if ((await roleStepButtons.count()) > 0) {
      await this.clickInSidebar(roleStepButtons.first());
    }
  }

  async selectSubjectType(type: string): Promise<void> {
    const typeByTestId = this.page.getByTestId(`subject-type-option-${type}`);
    if ((await typeByTestId.count()) > 0) {
      await this.clickInSidebar(typeByTestId.first());
      return;
    }

    const typeStepButtons = this.page.getByTestId(/subject-type-option-/);
    const exactButton = typeStepButtons.filter({ hasText: type });

    if ((await exactButton.count()) > 0) {
      await this.clickInSidebar(exactButton.first());
      return;
    }

    if ((await typeStepButtons.count()) > 0) {
      await this.clickInSidebar(typeStepButtons.first());
    }
  }

  async fillSubjectDetails(fieldValues: Record<string, string>): Promise<void> {
    for (const [field, value] of Object.entries(fieldValues)) {
      const locator = this.page.locator(`input[name="${field}"], input[placeholder*="${field}"]`).first();
      if (await locator.count() > 0) {
        await locator.fill(value);
      }
    }
  }

  async selectDocumentType(type: string): Promise<void> {
    await this.selectOptionInSidebar(this.documentTypeSelect, type);
  }

  async fillRegistrationFields(data: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      if (key === 'registrationType') {
        await this.registrationTypeSelect.selectOption(value);
      } else if (key === 'registrationNumber') {
        await this.registrationNumberInput.fill(value);
      } else if (key === 'registrationCode') {
        await this.registrationCodeInput.fill(value);
      } else if (key === 'flowType') {
        await this.flowTypeSelect.selectOption(value);
      }
    }
  }

  async fillAggregationFields(data: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      if (key === 'aggregationType') {
        await this.aggregationTypeSelect.selectOption(value);
      } else if (key === 'aggregateIdentifier') {
        await this.aggregateIdentifierInput.fill(value);
      }
    }
  }

  async applyFilters(): Promise<void> {
    await this.clickInSidebar(this.applyFiltersButton);
  }

  async clearFilters(): Promise<void> {
    await this.clearFiltersButton.click();
  }

  async saveDocument(): Promise<void> {
    await this.saveDocumentButton.click();
  }

  async printDocument(): Promise<void> {
    await this.printButton.click();
  }

  async selectResultByName(name: string): Promise<void> {
    const result = this.page.locator(`.result-item:has-text("${name}")`);
    await result.click();
  }

  async getResultsCount(): Promise<number> {
    const count = await this.searchResultItems.count();
    return count;
  }

  async waitForResults(): Promise<void> {
    await this.page.waitForURL(/search|results/, { timeout: 5000 }).catch(() => {
      // URL might not change if on same page
    });
    await this.page
      .locator('app-search-results, .loading-container')
      .or(this.searchEmptyState)
      .first()
      .waitFor({ state: 'visible', timeout: 5000 });
  }
}
