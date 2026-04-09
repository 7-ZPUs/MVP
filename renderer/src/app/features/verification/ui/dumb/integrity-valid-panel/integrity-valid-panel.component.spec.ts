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
    expect(items.length).toBe(2);

    expect(items[0].textContent).toContain('Classe');
    expect(items[0].textContent).toContain('Node Valid 1');
    expect(items[0].textContent).toContain('/path/v1');
    expect(items[0].textContent).toContain('Valido');

    expect(items[1].textContent).toContain('Processo');
    expect(items[1].textContent).toContain('Process 2');
    expect(items[1].textContent).toContain('/path/v2');
    expect(items[1].textContent).toContain('Valido');
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

    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.status-pill')?.textContent).toContain('Invalido');
    expect(compiled.querySelector('.status-pill--invalid')).toBeTruthy();
    expect(compiled.querySelector('.node-error')?.textContent).toContain(
      'Errore: la classe contiene almeno un documento con impronta crittografica alterata',
    );
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
    expect(compiled.querySelector('.node-error')).toBeNull();
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

    expect(component.getStatusClass(IntegrityStatusEnum.VALID)).toBe('status-pill status-pill--valid');
    expect(component.getStatusClass(IntegrityStatusEnum.INVALID)).toBe(
      'status-pill status-pill--invalid',
    );
    expect(component.getStatusClass(IntegrityStatusEnum.UNKNOWN)).toBe(
      'status-pill status-pill--unknown',
    );
  });

});
