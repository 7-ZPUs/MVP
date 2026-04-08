import { expect, Locator, Page } from '@playwright/test';

export class AttachmentsPage {
  constructor(private readonly page: Page) {}

  get heading(): Locator {
    return this.page.getByTestId('attachments-heading');
  }

  get numeroRow(): Locator {
    return this.page.getByTestId('attachments-row-numero');
  }

  get emptyMessage(): Locator {
    return this.page.getByTestId('attachments-empty');
  }

  get list(): Locator {
    return this.page.getByTestId('attachments-list');
  }

  item(index: number): Locator {
    return this.page.getByTestId(`attachment-item-${index}`);
  }

  itemId(index: number): Locator {
    return this.item(index).getByTestId('attachment-id');
  }

  itemDescription(index: number): Locator {
    return this.item(index).getByTestId('attachment-desc');
  }

  async openDocumentDetail(documentId = '301'): Promise<void> {
    await this.page.goto(`/#/detail/DOCUMENT/${documentId}`);
    await expect(this.heading).toBeVisible();
  }
}
