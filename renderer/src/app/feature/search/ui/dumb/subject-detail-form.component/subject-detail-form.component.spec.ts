import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubjectDetailFormComponent } from './subject-detail-form.component';

describe('SubjectDetailFormComponent', () => {
  let component: SubjectDetailFormComponent;
  let fixture: ComponentFixture<SubjectDetailFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubjectDetailFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SubjectDetailFormComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
