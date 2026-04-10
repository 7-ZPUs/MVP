import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import {
  CustomFilterValues,
  ValidationResult,
  ValidationError,
} from '../../../../../../../../shared/domain/metadata';
import { simplifyCustomMetadataLabel } from '../../../../../shared/utils/custom-metadata-label.util';

@Component({
  selector: 'app-custom-meta-filters',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './custom-meta-filters.component.html',
})
export class CustomMetaFiltersComponent implements OnChanges, OnDestroy {
  @Input() filters: CustomFilterValues[] | null = null;
  @Input() validationResult: ValidationResult | null = null;
  @Input() availableKeys: string[] = [];

  @Output() filtersChanged = new EventEmitter<CustomFilterValues[] | null>();

  public form: FormGroup;
  private readonly destroy$ = new Subject<void>();

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group({
      entries: this.fb.array([]),
    });

    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((val) => {
      const validEntries = val.entries.filter(
        (e: CustomFilterValues) => e.field?.trim() || e.value?.trim(),
      );

      if (validEntries.length === 0) {
        this.filtersChanged.emit(null);
      } else {
        this.filtersChanged.emit(validEntries);
      }
    });
  }

  get entries(): FormArray {
    return this.form.get('entries') as FormArray;
  }

  public addEntry(entry?: CustomFilterValues, emitEvent: boolean = true): void {
    this.entries.push(
      this.fb.group({
        field: [entry?.field ?? ''],
        value: [entry?.value ?? ''],
      }),
      { emitEvent },
    );
  }

  public removeEntry(index: number): void {
    this.entries.removeAt(index);
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if ('filters' in changes) {
      const newFilters = this.normalizeEntries(
        changes['filters'].currentValue as CustomFilterValues[] | null,
      );
      const currentEntries = this.normalizeEntries(
        this.entries.getRawValue() as CustomFilterValues[],
      );
      const currentMeaningfulEntries = currentEntries.filter((entry) =>
        this.isMeaningfulEntry(entry),
      );

      // Avoid rebuilding controls when parent echoes back only meaningful entries while user keeps drafting.
      if (this.areEntriesEqual(newFilters, currentMeaningfulEntries)) {
        return;
      }

      this.entries.clear({ emitEvent: false });

      newFilters.forEach((f) => this.addEntry(f, false));
    }
  }

  private normalizeEntries(entries: CustomFilterValues[] | null | undefined): CustomFilterValues[] {
    if (!Array.isArray(entries)) {
      return [];
    }

    return entries.map((entry) => ({
      field: entry?.field ?? '',
      value: entry?.value ?? '',
    }));
  }

  private isMeaningfulEntry(entry: CustomFilterValues | null | undefined): boolean {
    return !!entry?.field?.trim() || !!entry?.value?.trim();
  }

  private areEntriesEqual(left: CustomFilterValues[], right: CustomFilterValues[]): boolean {
    if (left.length !== right.length) {
      return false;
    }

    for (let i = 0; i < left.length; i++) {
      if (left[i].field !== right[i].field || left[i].value !== right[i].value) {
        return false;
      }
    }

    return true;
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public getError(index: number, controlName: string): ValidationError | undefined {
    return this.validationResult?.errors.get(`customMeta[${index}].${controlName}`)?.[0];
  }

  public hasAnyError(): boolean {
    if (!this.validationResult?.errors) {
      return false;
    }
    return Array.from(this.validationResult.errors.keys()).some((key) =>
      key.startsWith('customMeta['),
    );
  }

  public getSelectableKeys(index: number): string[] {
    const normalizedKeys = Array.from(
      new Set(
        (this.availableKeys || [])
          .filter((key): key is string => typeof key === 'string')
          .map((key) => key.trim())
          .filter((key) => key.length > 0),
      ),
    ).sort((left, right) => left.localeCompare(right));

    const currentValue = String(this.entries.at(index)?.get('field')?.value ?? '').trim();
    if (!currentValue) {
      return normalizedKeys;
    }

    return normalizedKeys.includes(currentValue) ? normalizedKeys : [currentValue, ...normalizedKeys];
  }

  public getSelectableKeyLabel(key: string): string {
    return simplifyCustomMetadataLabel(key) || key;
  }
}
