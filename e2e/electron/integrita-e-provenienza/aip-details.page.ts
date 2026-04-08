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
    return this.page.getByRole('button', { name: /scarica \/ esporta/i });
  }

  get verificationStatusLabel(): Locator {
    return this.page.locator('.status-label');
  }

  get aipHeading(): Locator {
    return this.page.getByRole('heading', { name: /informazioni aip/i });
  }

  get aipClassRow(): Locator {
    return this.page.locator('.metadata-card .data-row').filter({ hasText: 'Classe Documentale:' });
  }

  get aipUuidRow(): Locator {
    return this.page.locator('.metadata-card .data-row').filter({ hasText: 'UUID:' });
  }

  get conservationHeading(): Locator {
    return this.page.getByRole('heading', { name: /processo di conservazione/i });
  }

  get conservationProcessRow(): Locator {
    return this.page.locator('.metadata-card .data-row').filter({ hasText: 'Processo:' });
  }

  get conservationSessionRow(): Locator {
    return this.page.locator('.metadata-card .data-row').filter({ hasText: 'Sessione:' });
  }

  get conservationStartDateRow(): Locator {
    return this.page.locator('.metadata-card .data-row').filter({ hasText: 'Data Inizio:' });
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
