import { expect, Locator, Page } from '@playwright/test';

function toTestIdSuffix(value: string): string {
  return value.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replaceAll(/(^-|-$)/g, '');
}

export class DocumentMetadataPage {
  constructor(private readonly page: Page) {}

  get detailTitle(): Locator {
    return this.page.getByRole('heading', { name: 'Dettaglio Documento' });
  }

  get mainMetadataHeading(): Locator {
    return this.page.getByTestId('document-metadata-heading');
  }

  get classificationHeading(): Locator {
    return this.page.getByTestId('classification-heading');
  }

  get additionalMetadataHeading(): Locator {
    return this.page.getByTestId('custom-metadata-heading');
  }

  async openDocumentDetail(documentId = '301'): Promise<void> {
    await this.page.goto(`/#/detail/DOCUMENT/${documentId}`);
    await expect(this.detailTitle).toBeVisible();
  }

  rowByLabel(cardHeading: string, label: string): Locator {
    if (cardHeading === 'Metadati Principali' && label === 'Descrizione:') {
      return this.page.getByTestId('document-metadata-row-descrizione');
    }

    if (cardHeading === 'Classificazione' && label === 'Indice:') {
      return this.page.getByTestId('classification-row-indice');
    }

    if (cardHeading === 'Classificazione' && label === 'Descrizione:') {
      return this.page.getByTestId('classification-row-descrizione');
    }

    if (cardHeading === 'Classificazione' && label === 'Piano (URI):') {
      return this.page.getByTestId('classification-row-uri-piano');
    }

    throw new Error(`Unsupported row selector mapping for ${cardHeading} / ${label}`);
  }

  additionalMetadataRow(name: string): Locator {
    return this.page.getByTestId(`custom-metadata-row-${toTestIdSuffix(name)}`);
  }

  additionalMetadataValue(name: string): Locator {
    return this.additionalMetadataRow(name).locator('td').nth(1);
  }
}
