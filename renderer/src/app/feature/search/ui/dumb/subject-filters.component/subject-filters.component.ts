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
} from '../../../../../../../../shared/domain/metadata/search-subject-filters-models';
import { SubjectRoleType, SubjectType } from '../../../../../../../../shared/domain/metadata/search.enum';
import { ValidationResult } from '../../../../../../../../shared/domain/metadata';

type WizardStep = 0 | 1 | 2 | 3;

@Component({
  selector: 'app-subject-filters',
  standalone: true,
  imports: [CommonModule, SubjectDetailFormComponent],
  templateUrl: './subject-filters.component.html',
})
export class SubjectFiltersComponent implements OnChanges {
  @Input() subject: SubjectCriteria[] = [];
  @Input() resetCounter: number = 0;
  @Input() validationResult: ValidationResult | null = null;

  @Output() subjectChanged = new EventEmitter<SubjectCriteria[]>();

  public subjectsList = signal<SubjectCriteria[]>([]);

  public currentStep = signal(0); 
  
  public selectedRole = signal<SubjectRoleType | null>(null);
  public selectedType = signal<SubjectType | null>(null);
  public currentDetails = signal<any | null>(null);

  public RoleType = SubjectRoleType;
  public SubjType = SubjectType;

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['resetCounter'] && !changes['resetCounter'].firstChange) {
      this.resetWizard();
      this.subjectsList.set([]);
    }

    if (changes['subject']?.currentValue) {
      this.subjectsList.set(changes['subject'].currentValue || []);
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
  }

  public nextStep(): void {
    const step = this.currentStep();
    if (step < 3) this.currentStep.set((step + 1) as WizardStep);
  }

  public prevStep(): void {
    const step = this.currentStep();
    if (step > 1) this.currentStep.set((step - 1) as WizardStep);
  }

  public startWizard(): void {
    this.currentStep.set(1);
  }

  public resetWizard(): void {
    this.currentStep.set(0);
    this.selectedRole.set(null);
    this.selectedType.set(null);
    this.currentDetails.set(null);
  }

  public addSubjectToList(): void {
    const role = this.selectedRole();
    const type = this.selectedType();
    const details = this.currentDetails();

    if (role && type && details) {
      const newSubject = { role, type, details } as unknown as SubjectCriteria;
      const updatedList = [...this.subjectsList(), newSubject];
      
      this.subjectsList.set(updatedList);
      this.subjectChanged.emit(updatedList);
      this.resetWizard();
    }
  }

  public removeSubject(index: number): void {
    const updatedList = this.subjectsList().filter((_, i) => i !== index);
    this.subjectsList.set(updatedList);
    this.subjectChanged.emit(updatedList);
  }
}