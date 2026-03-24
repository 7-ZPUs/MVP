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

import { CustomFilterValues, ValidationResult, ValidationError } from '../../../domain';

@Component({
  selector: 'app-custom-meta-filters',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './custom-meta-filters.component.html',
})
export class CustomMetaFiltersComponent implements OnChanges, OnDestroy {
  @Input() filters: CustomFilterValues | null = null; // Assumendo che sia un array di {name, value}
  @Input() validationResult: ValidationResult | null = null;

  @Output() filtersChanged = new EventEmitter<CustomFilterValues>();

  public form: FormGroup;
  private readonly destroy$ = new Subject<void>();

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group({
      entries: this.fb.array([]),
    });

    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      // Emettiamo solo l'array delle entries
      this.filtersChanged.emit(value.entries as CustomFilterValues);
    });
  }

  get entries(): FormArray {
    return this.form.get('entries') as FormArray;
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if ('filters' in changes) {
      this.syncFormArray(changes['filters'].currentValue);
    }
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public addEntry(): void {
    this.entries.push(this.createEntryGroup('', ''));
  }

  public removeEntry(index: number): void {
    this.entries.removeAt(index);
  }

  public getError(index: number, field: string): ValidationError | undefined {
    return this.validationResult?.errors.get(`customMeta[${index}].${field}`)?.[0];
  }

  private createEntryGroup(name: string, value: string): FormGroup {
    return this.fb.group({
      name: [name],
      value: [value],
    });
  }

  private syncFormArray(newFilters: any[]): void {
    this.entries.clear({ emitEvent: false });

    const filtersArray = Array.isArray(newFilters) ? newFilters : [];
    filtersArray.forEach((entry) => {
      this.entries.push(this.createEntryGroup(entry.name || '', entry.value || ''), {
        emitEvent: false,
      });
    });
  }
}
