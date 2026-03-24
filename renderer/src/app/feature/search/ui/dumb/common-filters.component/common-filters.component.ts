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

import { CommonFilterValues, ValidationResult, ValidationError } from '../../../domain';

@Component({
  selector: 'app-common-filters',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './common-filters.component.html',
})
export class CommonFiltersComponent implements OnChanges, OnDestroy {
  @Input() filters: CommonFilterValues = {} as CommonFilterValues;
  @Input() validationResult: ValidationResult | null = null;

  @Output() filtersChanged = new EventEmitter<CommonFilterValues>();
  @Output() validationError = new EventEmitter<{ field: string; error: ValidationError | null }>();

  public form: FormGroup;
  private readonly destroy$ = new Subject<void>();

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group({
      chiaveDescrittiva: [null],
      classificazione: [null],
      conservazione: [null],
      note: [null],
      tipo: [null],
    });

    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.filtersChanged.emit(value as CommonFilterValues);
    });
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['filters']?.currentValue) {
      this.form.patchValue(changes['filters'].currentValue, { emitEvent: false });
    }
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public getError(field: string): ValidationError | undefined {
    const errors = this.validationResult?.errors.get(`common.${field}`);
    return errors ? errors[0] : undefined;
  }
}
