import { Locator, Page } from '@playwright/test';

function escapeRegex(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
}

function toTestIdSuffix(value: string): string {
  return value.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replaceAll(/(^-|-$)/g, '');
}

export class SubjectAnagraphicPage {
  constructor(private readonly page: Page) {}

  private customMetadataRow(fieldName: string): Locator {
    const escapedFieldName = fieldName.replaceAll('"', '\\"');
    return this.page
      .locator('[data-testid^="custom-metadata-row-"]')
      .filter({ has: this.page.locator(`[data-testid="custom-metadata-name"][title="${escapedFieldName}"]`) });
  }

  get subjectsHeading(): Locator {
    return this.page.getByTestId('subjects-heading');
  }

  get subjectCards(): Locator {
    return this.page.locator('[data-testid^="subject-card-"]');
  }

  subjectCardByRole(role: string): Locator {
    return this.page.getByTestId(`subject-card-${toTestIdSuffix(role)}`);
  }

  subjectTypeBadgeByRole(role: string): Locator {
    return this.subjectCardByRole(role).getByTestId('subject-type');
  }

  subjectFieldByRole(role: string, fieldLabel: string): Locator {
    const rawLabel = fieldLabel.replace(':', '');
    const byTestId = this.subjectCardByRole(role).getByTestId(
      `subject-field-${toTestIdSuffix(role)}-${toTestIdSuffix(rawLabel)}`,
    );

    return byTestId.or(
      this.subjectCardByRole(role)
        .locator('[data-testid^="subject-field-"]')
        .filter({ has: this.page.getByTestId('subject-field-label').filter({ hasText: new RegExp(String.raw`^\s*${escapeRegex(fieldLabel)}\s*$`) }) }),
    );
  }

  additionalSubjectMetadataValue(fieldName: string): Locator {
    return this.customMetadataRow(fieldName).getByTestId('custom-metadata-value');
  }
}
