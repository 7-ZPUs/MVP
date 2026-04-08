import { Locator, Page } from '@playwright/test';

function toTestIdSuffix(value: string): string {
  return value.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replaceAll(/(^-|-$)/g, '');
}

export class SessionDetailsPage {
  constructor(private readonly page: Page) {}

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
    return this.page.getByTestId(`custom-metadata-row-${toTestIdSuffix(fieldName)}`).getByTestId('custom-metadata-value');
  }
}
