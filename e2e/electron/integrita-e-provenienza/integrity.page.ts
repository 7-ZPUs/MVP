import { expect, Locator, Page } from '@playwright/test';

export class IntegrityPage {
  constructor(private readonly page: Page) {}

  get integritySectionButton(): Locator {
    return this.page.getByRole('button', { name: 'Sezione Integrita' }).or(this.page.getByRole('button', { name: 'Sezione Integrità' }));
  }

  get dashboardTitle(): Locator {
    return this.page.getByRole('heading', { name: /stato integrita dip|stato integrità dip/i });
  }

  get startVerificationButton(): Locator {
    return this.page
      .getByRole('button', { name: /avvia nuova verifica globale|verifica in corso/i })
      .first();
  }

  get errorBanner(): Locator {
    return this.page.locator('.error-banner').first();
  }

  get validElementsNumber(): Locator {
    return this.page.locator('[aria-label^="Elementi Integri"]').first();
  }

  get invalidElementsNumber(): Locator {
    return this.page.locator('[aria-label^="Elementi Corrotti"]').first();
  }

  get unverifiedElementsNumber(): Locator {
    return this.page.locator('[aria-label^="In Attesa di Verifica"]').first();
  }

  get corruptedPanelHeading(): Locator {
    return this.page.getByRole('heading', { name: /rilevate anomalie di integrita|rilevate anomalie di integrità/i });
  }

  get corruptedItems(): Locator {
    return this.page.locator('.corrupted-item');
  }

  get validPanelHeading(): Locator {
    return this.page.getByRole('heading', { name: /elementi analizzati e verificati/i });
  }

  get validRows(): Locator {
    return this.page.locator('.valid-row');
  }

  async gotoDashboard(): Promise<void> {
    try {
      await this.page.goto('/#/integrity-dashboard');
      await expect(this.dashboardTitle).toBeVisible();
      return;
    } catch {
      // Electron fullstack context does not support relative HTTP navigation.
    }

    await expect(this.integritySectionButton).toBeVisible();
    await this.integritySectionButton.click();
    await expect(this.dashboardTitle).toBeVisible();
  }

  async startGlobalVerification(): Promise<void> {
    await this.startVerificationButton.click();
  }
}
