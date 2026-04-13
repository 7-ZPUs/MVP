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
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';

import { FilterFieldType } from '../../../../../../../../shared/domain/metadata/search.enum';
import { SubjectType } from '../../../../../../../../shared/domain/metadata/subject.enum';
import {
  SubjectDetails,
  SubjectFieldDefinition,
  SUBJECT_STRATEGY_REGISTRY,
} from '../../../../../../../../shared/domain/metadata/search-subject-filters-models';

@Component({
  selector: 'app-subject-detail-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './subject-detail-form.component.html',
})
export class SubjectDetailFormComponent implements OnChanges, OnDestroy {
  @Input() subjectType: SubjectType | null = null;
  @Input() details: SubjectDetails | null = null;

  @Output() detailsChanged = new EventEmitter<SubjectDetails>();

  public form: FormGroup;
  public fields: SubjectFieldDefinition[] = [];
  public FieldType = FilterFieldType;
  private readonly destroy$ = new Subject<void>();

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group({});
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['subjectType']?.currentValue) {
      this.rebuildForm(changes['subjectType'].currentValue);
    }

    if (changes['details']?.currentValue && Object.keys(this.form.controls).length > 0) {
      this.form.patchValue(changes['details'].currentValue, { emitEvent: false });
    }
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private rebuildForm(type: SubjectType): void {
    const strategy = SUBJECT_STRATEGY_REGISTRY[type];

    this.fields = strategy ? strategy.getFields() : [];

    const group: any = {};
    this.fields.forEach((field) => {
      group[field.key] = [null, field.required ? [Validators.required] : []];
    });

    this.form = this.fb.group(group);

    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.detailsChanged.emit(value as SubjectDetails);
    });
  }
}
