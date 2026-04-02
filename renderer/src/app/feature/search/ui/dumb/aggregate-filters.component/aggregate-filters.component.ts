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
import { FormBuilder, FormGroup, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import {
  AggregateFilterValues,
  ValidationResult,
  ValidationError,
} from '../../../../../../../../shared/domain/metadata';
import {
  AggregationType,
  FascicoloType,
  ProcedimentoFaseType,
  AssegnazioneType,
} from '../../../../../../../../shared/domain/metadata/search.enum';

@Component({
  selector: 'app-aggregate-filters',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './aggregate-filters.component.html',
})
export class AggregateFiltersComponent implements OnChanges, OnDestroy {
  @Input() filters: AggregateFilterValues = {} as AggregateFilterValues;
  @Input() validationResult: ValidationResult | null = null;
  @Input() disabled: boolean = false;

  @Output() filtersChanged = new EventEmitter<AggregateFilterValues>();

  public form: FormGroup;
  private readonly destroy$ = new Subject<void>();

  // Enum per i template
  public aggregationTypes = Object.values(AggregationType);
  public fascicoloTypes = Object.values(FascicoloType);
  public faseTypes = Object.values(ProcedimentoFaseType);
  public assegnazioneTypes = Object.values(AssegnazioneType);

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group({
      tipoAggregazione: [null],
      idAggregazione: [null],
      tipoFascicolo: [null],
      dataApertura: [null],
      dataChiusura: [null],
      procedimento: this.fb.group({
        materia: [null],
        denominazioneProcedimento: [null],
        URICatalogo: [null],
        fasi: this.fb.array([]), // Array dinamico di fasi
      }),
      assegnazione: this.fb.group({
        tipoAssegnazione: [null],
        soggettoAssegn: [null], // Gestibile come ID o oggetto in base alla UI
        dataInizioAssegn: [null],
        dataFineAssegn: [null],
      }),
    });

    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.filtersChanged.emit(value as AggregateFilterValues);
    });
  }

  public get fasiFormArray(): FormArray {
    return this.form.get('procedimento.fasi') as FormArray;
  }

  public addFase(emitEvent: boolean = true): void {
    const faseGroup = this.fb.group({
      tipoFase: [null],
      dataInizioFase: [null],
      dataFineFase: [null],
    });
    this.fasiFormArray.push(faseGroup, { emitEvent });
  }

  public removeFase(index: number): void {
    this.fasiFormArray.removeAt(index);
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['filters']?.currentValue) {
      const newValues = changes['filters'].currentValue as AggregateFilterValues;

      if (Object.keys(newValues).length === 0) {
        this.fasiFormArray.clear({ emitEvent: false });
        this.form.reset({}, { emitEvent: false });
        return;
      }

      this.fasiFormArray.clear({ emitEvent: false });
      if (newValues.procedimento?.fasi) {
        newValues.procedimento.fasi.forEach(() => this.addFase(false));
      }

      this.form.patchValue(newValues, { emitEvent: false });
    }
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public getError(fieldPath: string): ValidationError | undefined {
    return this.validationResult?.errors.get(`aggregate.${fieldPath}`)?.[0];
  }

  public getFaseError(index: number, fieldPath: string): ValidationError | undefined {
    return this.validationResult?.errors.get(
      `aggregate.procedimento.fasi.${index}.${fieldPath}`,
    )?.[0];
  }

  public hasProcedimentoFasiErrors(): boolean {
    if (!this.validationResult?.errors) {
      return false;
    }

    return Array.from(this.validationResult.errors.keys()).some((key) =>
      key.startsWith('aggregate.procedimento.fasi.'),
    );
  }
}
