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
  AggregateFilterValues,
  ValidationResult,
  ValidationError,
} from '../../../../../shared/domain/metadata';

@Component({
  selector: 'app-aggregate-filters',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './aggregate-filters.component.html',
})
export class AggregateFiltersComponent implements OnChanges, OnDestroy {
  @Input() filters: AggregateFilterValues = {} as AggregateFilterValues;
  @Input() validationResult: ValidationResult | null = null;

  @Output() filtersChanged = new EventEmitter<AggregateFilterValues>();

  public form: FormGroup;
  private readonly destroy$ = new Subject<void>();

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group({
      fascicolo: [null],
      volume: [null],
      serie: [null],
    });

    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.filtersChanged.emit(value as AggregateFilterValues);
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
    return this.validationResult?.errors.get(`aggregate.${field}`)?.[0];
  }
}
