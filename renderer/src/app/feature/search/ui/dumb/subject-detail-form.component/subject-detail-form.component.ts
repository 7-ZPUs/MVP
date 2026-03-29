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

import { SubjectType, FilterFieldType } from '../../../../../../../../shared/metadata/search.enum';
import {
  SubjectDetails,
  SubjectFieldDefinition,
  SUBJECT_STRATEGY_REGISTRY, // <-- Aggiunto l'import del registro
} from '../../../../../../../../shared/metadata/search-subject-filters-models';

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
    // 1. Chiediamo al registro la strategia per questo tipo specifico
    const strategy = SUBJECT_STRATEGY_REGISTRY[type];

    // 2. Se esiste, recuperiamo i campi, altrimenti array vuoto
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
