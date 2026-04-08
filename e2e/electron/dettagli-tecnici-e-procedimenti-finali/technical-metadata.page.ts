import { expect, Locator, Page } from '@playwright/test';

function toTestIdSuffix(value: string): string {
  return value.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replaceAll(/(^-|-$)/g, '');
}

export class TechnicalMetadataPage {
  constructor(private readonly page: Page) {}

  get detailTitle(): Locator {
    return this.page.getByText('Dettaglio Documento');
  }

  get documentMetadataHeading(): Locator {
    return this.page.getByTestId('document-metadata-heading');
  }

  get registrationHeading(): Locator {
    return this.page.getByTestId('registration-heading');
  }

  get formatHeading(): Locator {
    return this.page.getByTestId('format-info-heading');
  }

  get verificationHeading(): Locator {
    return this.page.getByTestId('verification-info-heading');
  }

  get classificationHeading(): Locator {
    return this.page.getByTestId('classification-heading');
  }

  get customMetadataHeading(): Locator {
    return this.page.getByTestId('custom-metadata-heading');
  }

  get customMetadataEmpty(): Locator {
    return this.page.getByTestId('optional-field-absent-message');
  }

  get changeTrackingHeading(): Locator {
    return this.page.getByTestId('change-tracking-heading');
  }

  get registrationTipoRegistro(): Locator {
    return this.page.getByTestId('registration-row-tipo-registro');
  }

  get registrationFlusso(): Locator {
    return this.page.getByTestId('registration-row-flusso');
  }

  get registrationProtocollo(): Locator {
    return this.page.getByTestId('registration-row-protocollo');
  }

  get registrationCodice(): Locator {
    return this.page.getByTestId('registration-row-codice');
  }

  get documentNome(): Locator {
    return this.page.getByTestId('document-metadata-row-nome');
  }

  get documentTipo(): Locator {
    return this.page.getByTestId('document-metadata-row-tipo-doc');
  }

  get documentFormazione(): Locator {
    return this.page.getByTestId('document-metadata-row-formazione');
  }

  get documentRiservatezza(): Locator {
    return this.page.getByTestId('document-metadata-row-riservatezza');
  }

  get documentVersione(): Locator {
    return this.page.getByTestId('document-metadata-row-versione');
  }

  get formatTipo(): Locator {
    return this.page.getByTestId('format-info-row-tipo');
  }

  get formatProdotto(): Locator {
    return this.page.getByTestId('format-info-row-prodotto');
  }

  get formatProduttore(): Locator {
    return this.page.getByTestId('format-info-row-produttore');
  }

  get verificationFirma(): Locator {
    return this.page.getByTestId('verification-info-row-firma-digitale');
  }

  get verificationSigillo(): Locator {
    return this.page.getByTestId('verification-info-row-sigillo');
  }

  get verificationMarcatura(): Locator {
    return this.page.getByTestId('verification-info-row-marcatura-temporale');
  }

  get verificationConformitaCopie(): Locator {
    return this.page.getByTestId('verification-info-row-conformita-copie');
  }

  get changeTipo(): Locator {
    return this.page.getByTestId('change-tracking-row-tipo');
  }

  get changeSoggetto(): Locator {
    return this.page.getByTestId('change-tracking-row-soggetto');
  }

  get changeData(): Locator {
    return this.page.getByTestId('change-tracking-row-data');
  }

  get changeIdVersionePrecedente(): Locator {
    return this.page.getByTestId('change-tracking-row-id-versione-precedente');
  }

  get classificationIndice(): Locator {
    return this.page.getByTestId('classification-row-indice');
  }

  get classificationDescrizione(): Locator {
    return this.page.getByTestId('classification-row-descrizione');
  }

  get formatSoftwareInfoRow(): Locator {
    return this.page.getByTestId('format-info-row-prodotto');
  }

  customMetadataValue(fieldName: string): Locator {
    return this.page
      .getByTestId(`custom-metadata-row-${toTestIdSuffix(fieldName)}`)
      .getByTestId('custom-metadata-value');
  }

  customMetadataRow(fieldName: string): Locator {
    return this.page.getByTestId(`custom-metadata-row-${toTestIdSuffix(fieldName)}`);
  }

  async openDocumentDetail(documentId = '301'): Promise<void> {
    await this.page.goto(`/#/detail/DOCUMENT/${documentId}`);
    await expect(this.documentMetadataHeading).toBeVisible();
  }
}
