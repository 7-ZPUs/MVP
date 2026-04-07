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

@Component({
  selector: 'app-custom-meta-filters',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './custom-meta-filters.component.html',
})
export class CustomMetaFiltersComponent implements OnChanges, OnDestroy {
  @Input() filters: CustomFilterValues[] | null = null;
  @Input() validationResult: ValidationResult | null = null;

  @Output() filtersChanged = new EventEmitter<CustomFilterValues[] | null>();

  public form: FormGroup;
  private readonly destroy$ = new Subject<void>();

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group({
      entries: this.fb.array([]),
    });

    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((val) => {
      const validEntries = val.entries.filter(
        (e: CustomFilterValues) => e.field?.trim() || e.value?.trim()
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
      { emitEvent }
    );
  }

  public removeEntry(index: number): void {
    this.entries.removeAt(index);
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if ('filters' in changes) {
      const newFilters = changes['filters'].currentValue as CustomFilterValues[] | null;

      this.entries.clear({ emitEvent: false });

      if (newFilters && newFilters.length > 0) {
        newFilters.forEach((f) => this.addEntry(f, false));
      }
    }
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
      (key as string).startsWith('customMeta[')
    );
  }
}