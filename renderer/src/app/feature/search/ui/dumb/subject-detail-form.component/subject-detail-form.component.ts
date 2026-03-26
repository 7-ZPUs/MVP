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

import { SubjectType, FilterFieldType } from '../../../../../shared/domain/metadata/search.enum';

import {
  SubjectDetails,
  SubjectFieldDefinition,
} from '../../../../../shared/domain/metadata/search-subject-filters-models';

@Component({
  selector: 'app-subject-detail-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './subject-detail-form.component.html',
})
export class SubjectDetailFormComponent implements OnChanges, OnDestroy {
  @Input() subjectType: SubjectType | null = null;
  @Input() details: SubjectDetails | null = null;
  // Teniamo l'Input per non rompere il parent, ma per ora lo ignoriamo
  @Input() strategyRegistry: any = null;

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
    if ('subjectType' in changes && this.subjectType) {
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
    // --- TEMPORANEO: Switch invece della Strategy ---
    this.fields = this.getTemporaryFieldsForType(type);

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

  // Fallback temporaneo per mappare i tuoi modelli
  private getTemporaryFieldsForType(type: SubjectType): SubjectFieldDefinition[] {
    switch (type) {
      case SubjectType.PAI:
        return [
          {
            key: 'denominazione',
            label: 'Denominazione',
            type: FilterFieldType.TEXT,
            required: false,
          },
          { key: 'codiceIPA', label: 'Codice IPA', type: FilterFieldType.TEXT, required: false },
        ];
      case SubjectType.PF:
        return [
          { key: 'cognomePF', label: 'Cognome', type: FilterFieldType.TEXT, required: true },
          { key: 'nomePF', label: 'Nome', type: FilterFieldType.TEXT, required: true },
        ];
      default:
        // Campi di fallback generici per gli altri tipi
        return [
          {
            key: 'identificativo',
            label: 'Identificativo / CF',
            type: FilterFieldType.TEXT,
            required: false,
          },
        ];
    }
  }
}
