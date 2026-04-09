import { Locator, Page } from '@playwright/test';

export class SessionDetailsPage {
  constructor(private readonly page: Page) {}

  private customMetadataRow(fieldName: string): Locator {
    const escapedFieldName = fieldName.replaceAll('"', '\\"');
    return this.page
      .locator('[data-testid^="custom-metadata-row-"]')
      .filter({ has: this.page.locator(`[data-testid="custom-metadata-name"][title="${escapedFieldName}"]`) });
  }

  get conservationProcessHeading(): Locator {
    return this.page.getByTestId('conservation-process-heading');
  }

  conservationProcessRow(label: string): Locator {
    if (label === 'Processo:') {
      return this.page.getByTestId('conservation-process-row-processo');
    }

    if (label === 'Data Inizio:') {
      return this.page.getByTestId('conservation-process-row-data-inizio');
    }

    throw new Error(`Unsupported conservation row mapping for ${label}`);
  }

  sessionMetadataValue(fieldName: string): Locator {
    return this.customMetadataRow(fieldName).getByTestId('custom-metadata-value');
  }
}
