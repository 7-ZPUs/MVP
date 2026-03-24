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

import {
  SubjectType,
  SubjectDetails,
  ISubjectDetailStrategy,
  SubjectFieldDefinition,
  FilterFieldType,
} from '../../../../../shared/domain/metadata';

@Component({
  selector: 'app-subject-detail-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './subject-detail-form.component.html',
})
export class SubjectDetailFormComponent implements OnChanges, OnDestroy {
  @Input() strategyRegistry: Map<SubjectType, ISubjectDetailStrategy> | null = null;
  @Input() subjectType: SubjectType | null = null;
  @Input() details: SubjectDetails | null = null;

  @Output() detailsChanged = new EventEmitter<SubjectDetails>();

  public form: FormGroup;
  public fields: SubjectFieldDefinition[] = [];

  public FieldType = FilterFieldType;
  private readonly destroy$ = new Subject<void>();

  constructor(private readonly fb: FormBuilder) {
    this.form = this.fb.group({});

    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.detailsChanged.emit(value as SubjectDetails);
    });
  }

  public ngOnChanges(changes: SimpleChanges): void {
    const typeChanged = 'subjectType' in changes || 'strategyRegistry' in changes;

    if (typeChanged && this.subjectType && this.strategyRegistry) {
      this.rebuildForm(this.subjectType);
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
    const strategy = this.strategyRegistry?.get(type);

    if (!strategy) {
      this.fields = [];
      this.form = this.fb.group({});
      return;
    }

    this.fields = strategy.getFields();

    const group: any = {};
    this.fields.forEach((field) => {
      const validators = field.required ? [Validators.required] : [];
      group[field.key] = [null, validators];
    });

    this.form = this.fb.group(group);

    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
      this.detailsChanged.emit(value as SubjectDetails);
    });
  }
}
