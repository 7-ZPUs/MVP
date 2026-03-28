import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
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
} from '../../../../../../../../shared/metadata';

import { CommonFiltersComponent } from '../../dumb/common-filters.component/common-filters.component';
import { DiDaiFiltersComponent } from '../../dumb/di-dai-filters.component/di-dai-filters.component';
import { AggregateFiltersComponent } from '../../dumb/aggregate-filters.component/aggregate-filters.component';
import { CustomMetaFiltersComponent } from '../../dumb/custom-meta-filters.component/custom-meta-filters.component';
import { SubjectFiltersComponent } from '../../dumb/subject-filters.component/subject-filters.component';

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
})
export class AdvancedFilterPanelComponent implements OnInit {
  @Input() filters!: SearchFilters;
  @Input() validator?: FilterValidatorFn;
  @Input() externalValidation: ValidationResult | null = null;

  @Output() filtersChanged = new EventEmitter<SearchFilters>();
  @Output() filtersSubmit = new EventEmitter<SearchFilters>();
  @Output() validationResult = new EventEmitter<ValidationResult>();
  // filterAdded e filterRemoved sembrano non usati nell'HTML, ma li lasciamo se servono altrove
  @Output() filterAdded = new EventEmitter<CustomFilterValues>();
  @Output() filterRemoved = new EventEmitter<string>();
  @Output() filtersReset = new EventEmitter<void>();

  public isExpanded: boolean = true;
  public currentValidationResult: ValidationResult | null = null;
  public subjectResetCounter: number = 0;

  public panelForm!: FormGroup;

  constructor(private readonly fb: FormBuilder) {}

  public ngOnInit(): void {
    this.panelForm = this.fb.group({
      common: [this.filters?.common || {}],
      diDai: [this.filters?.diDai || {}],
      aggregate: [this.filters?.aggregate || {}],
      customMeta: [this.filters?.customMeta || null],
      subject: [this.filters?.subject || null],
    });

    this.panelForm.valueChanges.subscribe((values) => {
      this.validateAndEmit(values);
    });
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

  public onSubjectChanged(subject: SubjectCriteria): void {
    const updatedFilters = { ...this.filters, subject };
    this.filtersChanged.emit(updatedFilters);
  }

  public onFieldValidationError(field: string, error: ValidationError | null): void {
    // Riservato per logiche future
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
    this.currentValidationResult = null; // Resetta anche gli errori visivi
    this.filtersReset.emit();
  }

  private validateAndEmit(formValues: any): void {
    const partialFilters: PartialSearchFilters = {
      common: formValues.common,
      diDai: formValues.diDai,
      aggregate: formValues.aggregate,
      customMeta: formValues.customMeta,
    };

    if (this.validator) {
      this.currentValidationResult = this.validator(partialFilters);
      this.validationResult.emit(this.currentValidationResult);
    }

    const fullFilters: SearchFilters = {
      ...this.filters,
      ...partialFilters,
    };
    this.filtersChanged.emit(fullFilters);
  }
}
