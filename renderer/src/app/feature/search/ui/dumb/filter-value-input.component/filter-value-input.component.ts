import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterFieldType } from '../../../../../shared/domain/metadata/search.enum';
import { SubjectFieldDefinition } from '../../../../../shared/domain/metadata/search-subject-filters-models';
import { ValidationError } from '../../../../../shared/domain/metadata';

import { FieldErrorComponent } from '../field-error.component/field-error.component';

@Component({
  selector: 'app-filter-value-input',
  standalone: true,
  imports: [CommonModule, FormsModule, FieldErrorComponent],
  templateUrl: './filter-value-input.component.html',
})
export class FilterValueInputComponent {
  @Input() definition!: SubjectFieldDefinition;
  @Input() value: any = null;
  @Input() errors: ValidationError[] | null = [];

  @Output() valueChanged = new EventEmitter<any>();

  public FieldType = FilterFieldType;

  public onModelChange(newValue: any): void {
    this.valueChanged.emit(newValue);
  }
}
