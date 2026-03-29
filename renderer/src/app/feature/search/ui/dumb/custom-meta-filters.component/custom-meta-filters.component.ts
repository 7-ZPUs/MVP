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
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import {
  CustomFilterValues,
  ValidationResult,
  ValidationError,
} from '../../../../../../../../shared/metadata';

@Component({
  selector: 'app-custom-meta-filters',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './custom-meta-filters.component.html',
})
export class CustomMetaFiltersComponent implements OnChanges, OnDestroy {
  @Input() filters: CustomFilterValues | null = null;
  @Input() validationResult: ValidationResult | null = null;

  @Output() filtersChanged = new EventEmitter<CustomFilterValues | null>();

  public form: FormGroup;
  private readonly destroy$ = new Subject<void>();

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group({
      field: [''],
      value: [''],
    });

    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((val) => {
      if (!val.field && !val.value) {
        this.filtersChanged.emit(null);
      } else {
        this.filtersChanged.emit(val as CustomFilterValues);
      }
    });
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if ('filters' in changes) {
      const newFilters = changes['filters'].currentValue;
      if (newFilters) {
        this.form.patchValue(newFilters, { emitEvent: false });
      } else {
        this.form.reset({ field: '', value: '' }, { emitEvent: false });
      }
    }
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public getError(controlName: string): ValidationError | undefined {
    return this.validationResult?.errors.get(`customMeta.${controlName}`)?.[0];
  }
}
