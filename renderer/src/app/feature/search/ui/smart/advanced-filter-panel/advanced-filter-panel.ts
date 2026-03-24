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
} from '../../../domain';

import { CommonFiltersComponent } from '../../dumb/common-filters.component/common-filters.component';
import { DiDaiFiltersComponent } from '../../dumb/di-dai-filters.component/di-dai-filters.component';

@Component({
  selector: 'app-advanced-filter-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CommonFiltersComponent, DiDaiFiltersComponent],
  templateUrl: './advanced-filter-panel.html',
})
export class AdvancedFilterPanelComponent implements OnInit {
  @Input() filters!: SearchFilters;
  @Input() validator!: FilterValidatorFn;
  @Input() externalValidation: ValidationResult | null = null;
  @Input() strategyRegistry!: Map<any, any>; // Sostituisci any con SubjectType e ISubjectDetailStrategy

  @Output() filtersChanged = new EventEmitter<SearchFilters>();
  @Output() filtersSubmit = new EventEmitter<SearchFilters>();
  @Output() validationResult = new EventEmitter<ValidationResult>();
  @Output() filterAdded = new EventEmitter<CustomFilterValues>();
  @Output() filterRemoved = new EventEmitter<string>();
  @Output() filtersReset = new EventEmitter<void>();

  public isExpanded: boolean = true;
  public currentValidationResult: ValidationResult | null = null;

  public panelForm!: FormGroup;

  constructor(private readonly fb: FormBuilder) {}

  public ngOnInit(): void {
    this.panelForm = this.fb.group({
      common: [this.filters?.common || {}],
      diDai: [this.filters?.diDai || {}],
      aggregate: [this.filters?.aggregate || {}],
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

  public onEntriesChanged(entries: CustomFilterValues): void {
    const updatedFilters = { ...this.filters, customMeta: entries };
    this.filtersChanged.emit(updatedFilters);
  }

  public onSubjectChanged(subject: SubjectCriteria): void {
    const updatedFilters = { ...this.filters, subject };
    this.filtersChanged.emit(updatedFilters);
  }

  public onFieldValidationError(field: string, error: ValidationError | null): void {
    // Gestione errori locali dei singoli campi (es. formato data errato)
  }

  public togglePanel(): void {
    this.isExpanded = !this.isExpanded;
  }

  public onSubmit(): void {
    if (this.currentValidationResult?.isValid !== false) {
      const finalFilters: SearchFilters = {
        ...this.filters,
        ...this.panelForm.value,
      };
      this.filtersSubmit.emit(finalFilters);
    }
  }

  public onReset(): void {
    this.panelForm.reset();
    this.filtersReset.emit();
  }

  private validateAndEmit(formValues: any): void {
    const partialFilters: PartialSearchFilters = {
      common: formValues.common,
      diDai: formValues.diDai,
      aggregate: formValues.aggregate,
      customMeta: this.filters?.customMeta || null,
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
