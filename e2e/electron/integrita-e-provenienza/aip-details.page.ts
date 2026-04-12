import { expect, Locator, Page } from '@playwright/test';

export class AipDetailsPage {
  constructor(private readonly page: Page) {}

  get documentDetailTitle(): Locator {
    return this.page.getByRole('heading', { name: 'Dettaglio Documento' });
  }

  get verifyIntegrityButton(): Locator {
    return this.page.getByRole('button', { name: /verifica integrita|verifica integrità/i });
  }

  get printButton(): Locator {
    return this.page.getByRole('button', { name: /stampa/i });
  }

  get exportButton(): Locator {
    return this.page.getByRole('button', { name: /scarica documento|scarica/i });
  }

  get verificationStatusLabel(): Locator {
    return this.page.locator('.status-label');
  }

  get aipHeading(): Locator {
    return this.page.getByRole('heading', { name: /informazioni aip/i });
  }

  get aipClassRow(): Locator {
    return this.page.getByTestId('aip-info-row-classe-documentale');
  }

  get aipUuidRow(): Locator {
    return this.page.getByTestId('aip-info-row-uuid');
  }

  get conservationHeading(): Locator {
    return this.page.getByTestId('conservation-process-heading');
  }

  get conservationProcessRow(): Locator {
    return this.page.getByTestId('conservation-process-row-processo');
  }

  get conservationSessionRow(): Locator {
    return this.page.getByTestId('conservation-process-row-sessione');
  }

  get conservationStartDateRow(): Locator {
    return this.page.getByTestId('conservation-process-row-data-inizio');
  }

  async openDocumentDetailFromTree(): Promise<void> {
    try {
      await this.page.goto('/#/detail/DOCUMENT/301');
    } catch {
      await expect(this.page.getByRole('button', { name: 'Ricerca' })).toBeVisible();

      const treeToggles = this.page.getByTestId('dip-tree-toggle');
      const treeNodes = this.page.getByTestId('dip-tree-node');

      await treeToggles.nth(0).click();
      await treeToggles.nth(1).click();
      await treeToggles.nth(2).click();
      await treeNodes.nth(3).click();
    }

    await expect(this.documentDetailTitle).toBeVisible();
  }
}
