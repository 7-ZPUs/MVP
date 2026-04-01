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
  DiDaiFilterValues,
  ValidationResult,
  ValidationError,
} from '../../../../../../../../shared/domain/metadata';

// Importa le tue enumerazioni. Aggiusta il path se necessario.
import {
  AGIDFormats,
  DIDAIFormation,
  FlowType,
  RegisterType,
  ModificationType,
} from '../../../../../../../../shared/domain/metadata/search.enum';

@Component({
  selector: 'app-di-dai-filters',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './di-dai-filters.component.html',
  styleUrls: ['./di-dai-filters.component.scss'], // Opzionale per lo stile
})
export class DiDaiFiltersComponent implements OnChanges, OnDestroy {
  @Input() filters: DiDaiFilterValues = {} as DiDaiFilterValues;
  @Input() validationResult: ValidationResult | null = null;

  @Output() filtersChanged = new EventEmitter<DiDaiFilterValues>();

  public form: FormGroup;
  private readonly destroy$ = new Subject<void>();

  // Esposizione delle enum per l'HTML
  public flowTypes = Object.values(FlowType);
  public registerTypes = Object.values(RegisterType);
  public didaiFormations = Object.values(DIDAIFormation);
  public agidFormats = Object.values(AGIDFormats);
  public modificationTypes = Object.values(ModificationType);

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group({
      // 1. Gruppo Registrazione
      registrazione: this.fb.group({
        tipologiaFlusso: [null],
        tipologiaRegistro: [null],
        dataRegistrazione: [null],
        oraRegistrazione: [null],
        numeroRegistrazione: [null],
        codiceRegistro: [null],
      }),

      // 2. Campi Base DiDai
      tipologia: [null],
      modalitaFormazione: [null],
      riservatezza: [null],

      // 3. Gruppo Identificativo Formato
      identificativoFormato: this.fb.group({
        formato: [null],
        nomeProdottoCreazione: [null],
        versioneProdottoCreazione: [null],
        produttoreProdottoCreazione: [null],
      }),

      // 4. Gruppo Verifica
      verifica: this.fb.group({
        formatoDigitalmente: [null],
        sigillatoElettr: [null],
        marcaturaTemporale: [null],
        conformitaCopie: [null],
      }),

      // 5. Altri Dati
      nome: [null],
      versione: [null],
      idPrimario: [null],

      // 6. Tracciature (Mantenuto come array vuoto per la struttura, gestibile tramite logica custom se serve)
      tracciatureModifiche: this.fb.array([]),
    });

    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.filtersChanged.emit(value as DiDaiFilterValues);
    });
  }

  public get tracciatureFormArray(): FormArray {
    return this.form.get('tracciatureModifiche') as FormArray;
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['filters']?.currentValue) {
      const newFilters = changes['filters'].currentValue as DiDaiFilterValues;

      if (Object.keys(newFilters).length === 0) {
        this.tracciatureFormArray.clear({ emitEvent: false });
        this.form.reset({}, { emitEvent: false });
        return;
      }

      this.tracciatureFormArray.clear({ emitEvent: false });
      if (newFilters.tracciatureModifiche && Array.isArray(newFilters.tracciatureModifiche)) {
        newFilters.tracciatureModifiche.forEach(() => this.addTracciatura(false));
      }

      this.form.patchValue(newFilters, { emitEvent: false });
    }
  }

  public addTracciatura(emitEvent: boolean = true): void {
    const modificaGroup = this.fb.group({
      tipoModifica: [null],
      dataModifica: [null],
      oraModifica: [null],
      idVersionePrec: [null],
    });
    this.tracciatureFormArray.push(modificaGroup, { emitEvent });
  }

  public removeTracciatura(index: number): void {
    this.tracciatureFormArray.removeAt(index);
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  public getError(fieldPath: string): ValidationError | undefined {
    return this.validationResult?.errors.get(`diDai.${fieldPath}`)?.[0];
  }

  public getTracciaturaError(index: number, fieldPath: string): ValidationError | undefined {
    return this.validationResult?.errors.get(
      `diDai.tracciatureModifiche.${index}.${fieldPath}`,
    )?.[0];
  }
}
