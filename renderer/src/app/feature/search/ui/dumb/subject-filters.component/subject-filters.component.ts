import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubjectDetailFormComponent } from '../subject-detail-form.component/subject-detail-form.component';

import {
  SubjectCriteria,
  ISubjectDetailStrategy,
} from '../../../../../../../../shared/domain/metadata/search-subject-filters-models';
import { SubjectRoleType, SubjectType } from '../../../../../../../../shared/domain/metadata/search.enum';
import { ValidationResult } from '../../../../../../../../shared/domain/metadata';

@Component({
  selector: 'app-subject-filters',
  standalone: true,
  imports: [CommonModule, SubjectDetailFormComponent],
  templateUrl: './subject-filters.component.html',
})
export class SubjectFiltersComponent implements OnChanges {
  @Input() subject: SubjectCriteria | null = null;
  @Input() resetCounter: number = 0;
  @Input() validationResult: ValidationResult | null = null;

  @Output() subjectChanged = new EventEmitter<SubjectCriteria>();

  public currentStep = signal<1 | 2 | 3>(1);
  public selectedRole = signal<SubjectRoleType | null>(null);
  public selectedType = signal<SubjectType | null>(null);
  public currentDetails = signal<any | null>(null);

  public RoleType = SubjectRoleType;
  public SubjType = SubjectType;

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['resetCounter'] && !changes['resetCounter'].firstChange) {
      this.reset();
    }

    if (changes['subject']?.currentValue) {
      const sub = changes['subject'].currentValue as SubjectCriteria;
      this.selectedRole.set(sub.role);
      this.selectedType.set(sub.type);
      this.currentDetails.set(sub.details);
      this.currentStep.set(3);
    }
  }

  public setRole(role: SubjectRoleType): void {
    this.selectedRole.set(role);
    this.nextStep();
  }

  public setType(type: SubjectType): void {
    this.selectedType.set(type);
    this.currentDetails.set(null);
    this.nextStep();
  }

  public onDetailsChanged(details: any): void {
    this.currentDetails.set(details);
    this.emitSubject();
  }

  public nextStep(): void {
    const step = this.currentStep();
    if (step < 3) this.currentStep.set((step + 1) as 1 | 2 | 3);
  }

  public prevStep(): void {
    const step = this.currentStep();
    if (step > 1) this.currentStep.set((step - 1) as 1 | 2 | 3);
  }

  public reset(): void {
    this.currentStep.set(1);
    this.selectedRole.set(null);
    this.selectedType.set(null);
    this.currentDetails.set(null);
  }

  private emitSubject(): void {
    const role = this.selectedRole();
    const type = this.selectedType();
    const details = this.currentDetails();

    if (role && type && details) {
      const criteria = { role, type, details } as unknown as SubjectCriteria;
      this.subjectChanged.emit(criteria);
    }
  }
}
