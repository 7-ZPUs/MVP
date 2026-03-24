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
  DiDaiFilterValues,
  ValidationResult,
  ValidationError,
} from '../../../../../shared/domain/metadata';

@Component({
  selector: 'app-di-dai-filters',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './di-dai-filters.component.html',
})
export class DiDaiFiltersComponent implements OnChanges, OnDestroy {
  @Input() filters: DiDaiFilterValues = {} as DiDaiFilterValues;
  @Input() validationResult: ValidationResult | null = null;

  @Output() filtersChanged = new EventEmitter<DiDaiFilterValues>();

  public form: FormGroup;
  private readonly destroy$ = new Subject<void>();

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group({
      tipologiaRegistro: [null],
      annoRegistro: [null],
      numeroRegistro: [null],
      dataRegistrazioneDa: [null],
      dataRegistrazioneA: [null],
      modalitaFormazione: [null],
    });

    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.filtersChanged.emit(value as DiDaiFilterValues);
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
    return this.validationResult?.errors.get(`diDai.${field}`)?.[0];
  }
}
