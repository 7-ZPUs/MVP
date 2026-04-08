import { expect, Locator, Page } from '@playwright/test';

export class DipNavigationPage {
  constructor(private readonly page: Page) {}

  get toolbarSearchButton(): Locator {
    return this.page.getByRole('button', { name: 'Ricerca' });
  }

  get searchInput(): Locator {
    return this.page.getByTestId('search-input').or(this.page.getByPlaceholder('Inserisci testo di ricerca...'));
  }

  get searchSubmitButton(): Locator {
    return this.page.getByTestId('search-submit-button').or(this.page.getByRole('button', { name: '🔍 Cerca', exact: true }));
  }

  get semanticToggle(): Locator {
    return this.page.getByTestId('search-semantic-toggle').or(this.page.getByLabel('Ricerca Semantica'));
  }

  get classNameRadio(): Locator {
    return this.page.getByTestId('search-type-class').or(this.page.getByLabel('Nome Classe'));
  }

  get processIdRadio(): Locator {
    return this.page.getByTestId('search-type-process').or(this.page.getByLabel('ID Processo'));
  }

  get freeTextRadio(): Locator {
    return this.page.getByTestId('search-type-free').or(this.page.getByLabel('Testo Libero'));
  }

  get treeNodes(): Locator {
    return this.page.getByTestId('dip-tree-node');
  }

  get treeToggles(): Locator {
    return this.page.getByTestId('dip-tree-toggle');
  }

  get resultsTitle(): Locator {
    return this.page.getByTestId('search-page-title');
  }

  get emptyState(): Locator {
    return this.page.getByTestId('search-empty-state');
  }

  get errorBanner(): Locator {
    return this.page.getByTestId('search-error-banner');
  }

  get filterSidebarToggle(): Locator {
    return this.page.getByTestId('search-filters-toggle');
  }

  get applyFiltersButton(): Locator {
    return this.page.getByTestId('apply-filters-button');
  }

  get clearFiltersButton(): Locator {
    return this.page.getByTestId('clear-filters-button');
  }

  get typeSelect(): Locator {
    return this.page.getByTestId('document-type-select');
  }

  get conservationYearsInput(): Locator {
    return this.page.getByTestId('conservation-years-input');
  }

  get noteInput(): Locator {
    return this.page.getByTestId('note-input');
  }

  get oggettoInput(): Locator {
    return this.page.getByTestId('subject-input');
  }

  get paroleChiaveInput(): Locator {
    return this.page.getByTestId('keywords-input');
  }

  get codiceClassificazioneInput(): Locator {
    return this.page.getByTestId('classification-code-input');
  }

  get descrizioneClassificazioneInput(): Locator {
    return this.page.getByTestId('classification-description-input');
  }

  get ruoloStepTitle(): Locator {
    return this.page.getByRole('heading', { name: /seleziona il ruolo/i });
  }

  get addSubjectButton(): Locator {
    return this.page.getByTestId('add-subject-button');
  }

  async gotoSearchPage(): Promise<void> {
    await this.page.goto('/');
    await expect(this.toolbarSearchButton).toBeVisible();
    await this.toolbarSearchButton.click();
    await expect(this.searchInput).toBeVisible();
  }

  async expandTreeLevel(toggleIndex: number): Promise<void> {
    await this.treeToggles.nth(toggleIndex).click();
  }

  async search(text: string): Promise<void> {
    await this.searchInput.fill(text);
    await this.searchSubmitButton.click();
  }

  async openFilterSection(name: string): Promise<void> {
    const summaryByName: Record<string, string> = {
      'Dati Generali': 'filter-section-summary-general',
      'Chiave Descrittiva': 'filter-section-summary-key',
      'Classificazione': 'filter-section-summary-classification',
    };

    const summaryTestId = summaryByName[name];
    if (summaryTestId) {
      const summary = this.page.getByTestId(summaryTestId);
      if (await summary.count()) {
        await summary.click();
        return;
      }
    }

    const summary = this.page.getByText(name, { exact: true }).first();
    if (await summary.count()) {
      await summary.click();
    }
  }

  async startSubjectWizard(): Promise<void> {
    await this.addSubjectButton.click();
    await expect(this.ruoloStepTitle).toBeVisible();
  }
}
