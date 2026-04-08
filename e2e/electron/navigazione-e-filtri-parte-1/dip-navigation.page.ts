import { expect, Locator, Page } from '@playwright/test';

export class DipNavigationPage {
  constructor(private readonly page: Page) {}

  get toolbarSearchButton(): Locator {
    return this.page.getByRole('button', { name: 'Ricerca' });
  }

  get searchInput(): Locator {
    return this.page.getByPlaceholder('Inserisci testo di ricerca...');
  }

  get searchSubmitButton(): Locator {
    return this.page.getByRole('button', { name: '🔍 Cerca', exact: true });
  }

  get semanticToggle(): Locator {
    return this.page.getByLabel('Ricerca Semantica');
  }

  get classNameRadio(): Locator {
    return this.page.getByLabel('Nome Classe');
  }

  get processIdRadio(): Locator {
    return this.page.getByLabel('ID Processo');
  }

  get freeTextRadio(): Locator {
    return this.page.getByLabel('Testo Libero');
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
    return this.page.locator('#tipoDoc');
  }

  get conservationYearsInput(): Locator {
    return this.page.locator('#anniConservazione');
  }

  get noteInput(): Locator {
    return this.page.locator('#noteFilter');
  }

  get oggettoInput(): Locator {
    return this.page.locator('#oggettoFilter');
  }

  get paroleChiaveInput(): Locator {
    return this.page.locator('#paroleChiaveFilter');
  }

  get codiceClassificazioneInput(): Locator {
    return this.page.locator('#codiceClass');
  }

  get descrizioneClassificazioneInput(): Locator {
    return this.page.locator('#descrizioneClass');
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
    const summary = this.page.locator('summary', { hasText: name }).first();
    if (await summary.count()) {
      await summary.click();
      return;
    }

    const collapsibleLabel = this.page
      .locator('div, span, label, legend', { hasText: name })
      .first();

    if (await collapsibleLabel.count()) {
      await collapsibleLabel.click({ force: true });
    }
  }

  async startSubjectWizard(): Promise<void> {
    await this.addSubjectButton.click();
    await expect(this.ruoloStepTitle).toBeVisible();
  }
}
