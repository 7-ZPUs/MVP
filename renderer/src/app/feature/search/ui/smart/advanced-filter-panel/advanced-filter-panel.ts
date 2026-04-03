import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

import {
  SearchFilters,
  ValidationResult,
  FilterValidatorFn,
  CommonFilterValues,
  DiDaiFilterValues,
  AggregateFilterValues,
  CustomFilterValues,
  SubjectCriteria,
  ValidationError,
  PartialSearchFilters,
} from '../../../../../../../../shared/domain/metadata';

import { CommonFiltersComponent } from '../../dumb/common-filters.component/common-filters.component';
import { DiDaiFiltersComponent } from '../../dumb/di-dai-filters.component/di-dai-filters.component';
import { AggregateFiltersComponent } from '../../dumb/aggregate-filters.component/aggregate-filters.component';
import { CustomMetaFiltersComponent } from '../../dumb/custom-meta-filters.component/custom-meta-filters.component';
import { SubjectFiltersComponent } from '../../dumb/subject-filters.component/subject-filters.component';
import { FilterRulesManager, FilterUIState } from './filter-rules.manager';

@Component({
  selector: 'app-advanced-filter-panel',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CommonFiltersComponent,
    DiDaiFiltersComponent,
    AggregateFiltersComponent,
    CustomMetaFiltersComponent,
    SubjectFiltersComponent,
  ],
  templateUrl: './advanced-filter-panel.html',
  styleUrl: './advanced-filter-panel.scss',
})
export class AdvancedFilterPanelComponent implements OnInit, OnChanges {
  @Input() validator?: FilterValidatorFn;
  @Input() externalValidation: ValidationResult | null = null;
  
  private _filters: SearchFilters = {
    common: {},
    diDai: {},
    aggregate: {},
    customMeta: null,
    subject: []
  } as any;

  @Input()
  set filters(value: SearchFilters) {
    const incoming = value || {} as any;

    const safeFilters = {
      ...incoming,
      common: incoming.common || {},
      diDai: incoming.diDai || {},
      aggregate: incoming.aggregate || {},
      subject: incoming.subject || []
    };

    this._filters = safeFilters;

    if (this.panelForm) {
      const isReset =
        Object.keys(safeFilters.common).length === 0 &&
        Object.keys(safeFilters.diDai).length === 0 &&
        Object.keys(safeFilters.aggregate).length === 0 &&
        safeFilters.customMeta === null &&
        safeFilters.subject.length === 0;

      if (isReset) {
        this.panelForm.reset({}, { emitEvent: false });
        this.subjectResetCounter++;
      } else {
        this.panelForm.patchValue(safeFilters, { emitEvent: false });
      }
    }
  }

  get filters(): SearchFilters {
    return this._filters || ({ subject: [] } as any);
  }

  @Output() filtersChanged = new EventEmitter<SearchFilters>();
  @Output() filtersSubmit = new EventEmitter<SearchFilters>();
  @Output() validationResult = new EventEmitter<ValidationResult>();
  @Output() filterAdded = new EventEmitter<CustomFilterValues>();
  @Output() filterRemoved = new EventEmitter<string>();
  @Output() filtersReset = new EventEmitter<void>();

  public isExpanded: boolean = true;
  public currentValidationResult: ValidationResult | null = null;
  public subjectResetCounter: number = 0;

  public panelForm!: FormGroup;

  public uiState: FilterUIState = {
    disableAggregate: false,
    disableDiDai: false,
    motivoBloccoAggregate: '',
    motivoBloccoDiDai: '',
  };

  constructor(private readonly fb: FormBuilder) {}

  public ngOnInit(): void {
    this.panelForm = this.fb.group({
      common: [this.filters.common],
      diDai: [this.filters.diDai],
      aggregate: [this.filters.aggregate],
      customMeta: [this.filters.customMeta],
      subject: [this.filters.subject],
    });

    this.panelForm.valueChanges.subscribe((values) => {
      this.uiState = FilterRulesManager.calculateUIState(values);
      this.validateAndEmit(values);
    });
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['externalValidation']?.currentValue?.isValid === false) {
      this.isExpanded = true;
    }
  }

  public get effectiveValidationResult(): ValidationResult | null {
    if (this.externalValidation?.isValid === false) {
      return this.externalValidation;
    }
    return this.currentValidationResult || this.externalValidation;
  }

  public onCommonFiltersChanged(values: CommonFilterValues): void {
    this.panelForm.patchValue({ common: values }, { emitEvent: true });
  }

  public onDiDaiFiltersChanged(values: DiDaiFilterValues): void {
    this.panelForm.patchValue({ diDai: values }, { emitEvent: true });
  }

  public onAggregateFiltersChanged(values: AggregateFilterValues): void {
    this.panelForm.patchValue({ aggregate: values }, { emitEvent: true });
  }

  public onEntriesChanged(entries: CustomFilterValues | null): void {
    this.panelForm.patchValue({ customMeta: entries }, { emitEvent: true });
  }

  public onSubjectChanged(subject: SubjectCriteria[]): void {
    const updatedFilters = { ...this.filters, subject };
    this.filtersChanged.emit(updatedFilters);
  }

  public onFieldValidationError(field: string, error: ValidationError | null): void {
    // Riservato
  }

  public togglePanel(): void {
    this.isExpanded = !this.isExpanded;
  }

  public onSubmit(): void {
    if (
      this.currentValidationResult?.isValid !== false &&
      this.externalValidation?.isValid !== false
    ) {
      const finalFilters: SearchFilters = {
        ...this.filters,
        ...this.panelForm.value,
      };
      this.filtersSubmit.emit(finalFilters);
    }
  }

  public onReset(): void {
    this.panelForm.reset();
    this.subjectResetCounter++;
    this.currentValidationResult = null;
    this.filtersReset.emit();
  }

  private validateAndEmit(formValues: any): void {
    const partialSearchFilters: PartialSearchFilters = {
      common: formValues.common,
      diDai: formValues.diDai,
      aggregate: formValues.aggregate,
      customMeta: formValues.customMeta,
    };

    if (this.validator) {
      this.currentValidationResult = this.validator(partialSearchFilters);
      this.validationResult.emit(this.currentValidationResult);
    }

    const safeCurrentFilters = this.filters || ({} as any);

    const fullFilters: SearchFilters = {
      ...safeCurrentFilters,
      ...partialSearchFilters,
      subject: safeCurrentFilters.subject || []
    };
    this.filtersChanged.emit(fullFilters);
  }
}