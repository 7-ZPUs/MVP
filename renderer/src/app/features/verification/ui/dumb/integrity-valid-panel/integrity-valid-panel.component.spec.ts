import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IntegrityValidPanelComponent } from './integrity-valid-panel.component';
import { ComponentRef } from '@angular/core';
import { IntegrityStatusEnum } from '../../../../../shared/domain/value-objects/IntegrityStatusEnum';

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
        id: 1,
        name: 'Node Valid 1',
        type: 'CLASS',
        contextPath: '/path/v1',
        status: IntegrityStatusEnum.VALID,
      },
      {
        id: 2,
        name: 'Process 2',
        type: 'PROCESS',
        contextPath: '/path/v2',
        status: IntegrityStatusEnum.VALID,
      },
    ]);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.valid-container')).toBeTruthy();
    const items = compiled.querySelectorAll('.valid-row');
    expect(items.length).toBe(1);

    expect(items[0].textContent).toContain('Classe');
    expect(items[0].textContent).toContain('Node Valid 1');
    expect(items[0].textContent).toContain('Valido');
  });

  it('should render invalid label when node status is INVALID', () => {
    componentRef.setInput('nodes', [
      {
        id: 10,
        name: 'Classe Contratti',
        type: 'CLASS',
        status: IntegrityStatusEnum.INVALID,
      },
    ]);
    componentRef.setInput('corruptedNodes', [
      {
        id: 11,
        name: 'Doc 1',
        type: 'DOCUMENT',
        status: IntegrityStatusEnum.INVALID,
        contextPath: 'Classe: Classe Contratti | Processo: Processo A',
      },
    ]);

    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.status-pill')?.textContent).toContain('Invalido');
    expect(compiled.querySelector('.status-pill--invalid')).toBeTruthy();
    expect(compiled.querySelector('.error-group')).toBeTruthy();
    expect(compiled.textContent).toContain('Processo A');
    expect(compiled.textContent).toContain('Doc 1');
  });

  it('should not render error details for valid nodes', () => {
    componentRef.setInput('nodes', [
      {
        id: 20,
        name: 'Classe Delibere',
        type: 'CLASS',
        status: IntegrityStatusEnum.VALID,
      },
    ]);

    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.error-group')).toBeNull();
  });

  it('should format type correctly', () => {
    expect(component.formatType('CLASS')).toBe('Classe');
    expect(component.formatType('PROCESS')).toBe('Processo');
    expect(component.formatType('DOCUMENT')).toBe('Documento');
    expect(component.formatType('SOME_UNKNOWN_TYPE')).toBe('Documento');
  });

  it('should map status labels and css classes correctly', () => {
    expect(component.getStatusLabel(IntegrityStatusEnum.VALID)).toBe('Valido');
    expect(component.getStatusLabel(IntegrityStatusEnum.INVALID)).toBe('Invalido');
    expect(component.getStatusLabel(IntegrityStatusEnum.UNKNOWN)).toBe('Non verificato');

    expect(component.getStatusClass(IntegrityStatusEnum.VALID)).toBe(
      'status-pill status-pill--valid',
    );
    expect(component.getStatusClass(IntegrityStatusEnum.INVALID)).toBe(
      'status-pill status-pill--invalid',
    );
    expect(component.getStatusClass(IntegrityStatusEnum.UNKNOWN)).toBe(
      'status-pill status-pill--unknown',
    );
  });

  it('should correctly sort classNodes: INVALID first, then alphabetically by name', () => {
    componentRef.setInput('nodes', [
      { id: 1, name: 'Zebra', type: 'CLASS', status: IntegrityStatusEnum.VALID },
      { id: 2, name: 'Alpha', type: 'CLASS', status: IntegrityStatusEnum.VALID },
      { id: 3, name: 'Delta', type: 'CLASS', status: IntegrityStatusEnum.INVALID },
      { id: 4, name: 'Process 1', type: 'PROCESS', status: IntegrityStatusEnum.INVALID }, // should be filtered out
    ]);

    const computedNodes = component.classNodes();
    expect(computedNodes.length).toBe(3);
    // order should be: Delta (INVALID), Alpha (VALID, alphabetically first), Zebra (VALID)
    expect(computedNodes[0].name).toBe('Delta');
    expect(computedNodes[1].name).toBe('Alpha');
    expect(computedNodes[2].name).toBe('Zebra');
  });

  it('should parse various contextPath formats correctly in groupedErrors', () => {
    componentRef.setInput('nodes', []);
    componentRef.setInput('corruptedNodes', [
      {
        id: 1,
        name: 'Doc 1',
        type: 'DOCUMENT',
        status: IntegrityStatusEnum.INVALID,
        contextPath: undefined,
      },
      {
        id: 2,
        name: 'Doc 2',
        type: 'DOCUMENT',
        status: IntegrityStatusEnum.INVALID,
        contextPath: 'Classe: C1 | Processo: P1',
      },
      {
        id: 3,
        name: 'Doc 3',
        type: 'DOCUMENT',
        status: IntegrityStatusEnum.INVALID,
        contextPath: 'C2 > P2',
      },
      {
        id: 4,
        name: 'Doc 4',
        type: 'DOCUMENT',
        status: IntegrityStatusEnum.INVALID,
        contextPath: 'C3',
      },
    ]);

    const errors = component.groupedErrors();

    // Undefined fallback
    expect(errors.get('Classe non disponibile')?.processes[0].processName).toBe(
      'Processo non disponibile',
    );
    // Regex match (Classe: ... | Processo: ...)
    expect(errors.get('C1')?.processes[0].processName).toBe('P1');
    expect(errors.get('C1')?.totalDocuments).toBe(1);
    // Split match (C2 > P2)
    expect(errors.get('C2')?.processes[0].processName).toBe('P2');
    // Fallback match with class only (C3)
    expect(errors.get('C3')?.processes[0].processName).toBe('Processo non disponibile');
  });
});
