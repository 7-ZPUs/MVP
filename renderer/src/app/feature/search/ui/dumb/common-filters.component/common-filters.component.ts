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
  CommonFilterValues,
  ValidationResult,
  ValidationError,
} from '../../../../../shared/domain/metadata';
// Assicurati che il percorso dell'enum sia corretto
import { DocumentType } from '../../../../../shared/domain/metadata/search.enum';

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

  public form: FormGroup;
  private readonly destroy$ = new Subject<void>();

  public documentTypes = Object.values(DocumentType);

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group({
      chiaveDescrittiva: this.fb.group({
        oggetto: [null],
        paroleChiave: [null],
      }),
      classificazione: this.fb.group({
        codice: [null],
        descrizione: [null],
      }),
      conservazione: this.fb.group({
        valore: [null],
      }),
      note: [null],
      tipoDocumento: [null],
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

  public getError(fieldPath: string): ValidationError | undefined {
    const errors = this.validationResult?.errors.get(`common.${fieldPath}`);
    return errors ? errors[0] : undefined;
  }
}
