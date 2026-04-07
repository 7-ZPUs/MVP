import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IntegrityValidPanelComponent } from './integrity-valid-panel.component';
import { ComponentRef } from '@angular/core';

describe('IntegrityValidPanelComponent', () => {
  let component: IntegrityValidPanelComponent;
  let fixture: ComponentFixture<IntegrityValidPanelComponent>;
  let componentRef: ComponentRef<IntegrityValidPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntegrityValidPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IntegrityValidPanelComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
  });

  it('should create', () => {
    componentRef.setInput('nodes', []);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should not render anything if nodes is empty', () => {
    componentRef.setInput('nodes', []);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.valid-container')).toBeNull();
  });

  it('should render valid nodes when provided', () => {
    componentRef.setInput('nodes', [
      {
        id: '1',
        name: 'Node Valid 1',
        type: 'CLASS',
        contextPath: '/path/v1',
        hash: 'abc',
        valid: true,
      },
      {
        id: '2',
        name: 'Process 2',
        type: 'PROCESS',
        contextPath: '/path/v2',
        hash: 'def',
        valid: true,
      },
    ]);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.valid-container')).toBeTruthy();
    const items = compiled.querySelectorAll('.valid-row');
    expect(items.length).toBe(2);

    expect(items[0].textContent).toContain('Classe');
    expect(items[0].textContent).toContain('Node Valid 1');
    expect(items[0].textContent).toContain('/path/v1');

    expect(items[1].textContent).toContain('Processo');
    expect(items[1].textContent).toContain('Process 2');
    expect(items[1].textContent).toContain('/path/v2');
  });

  it('should format type correctly', () => {
    expect(component.formatType('CLASS')).toBe('Classe');
    expect(component.formatType('PROCESS')).toBe('Processo');
    expect(component.formatType('DOCUMENT')).toBe('Documento');
    expect(component.formatType('SOME_UNKNOWN_TYPE')).toBe('Documento');
  });
});
