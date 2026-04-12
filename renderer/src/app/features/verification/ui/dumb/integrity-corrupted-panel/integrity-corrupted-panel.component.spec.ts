import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IntegrityCorruptedPanelComponent } from './integrity-corrupted-panel.component';
import { ComponentRef } from '@angular/core';

describe('IntegrityCorruptedPanelComponent', () => {
  let component: IntegrityCorruptedPanelComponent;
  let fixture: ComponentFixture<IntegrityCorruptedPanelComponent>;
  let componentRef: ComponentRef<IntegrityCorruptedPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntegrityCorruptedPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IntegrityCorruptedPanelComponent);
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
    expect(compiled.querySelector('.alert-container')).toBeNull();
  });

  it('should render corrupted nodes when provided', () => {
    componentRef.setInput('nodes', [
      { id: '1', name: 'Node 1', type: 'CLASS', contextPath: '/path/1', hash: 'abc', valid: false },
      {
        id: '2',
        name: 'Doc 2',
        type: 'DOCUMENT',
        contextPath: '/path/2',
        hash: 'def',
        valid: false,
      },
    ]);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.alert-container')).toBeTruthy();
    const items = compiled.querySelectorAll('.corrupted-item');
    expect(items.length).toBe(2);

    expect(items[0].textContent).toContain('Classe');
    expect(items[0].textContent).toContain('Node 1');
    expect(items[0].textContent).toContain('/path/1');

    expect(items[1].textContent).toContain('Documento');
    expect(items[1].textContent).toContain('Doc 2');
    expect(items[1].textContent).toContain('/path/2');
  });

  it('should format type correctly', () => {
    expect(component.formatType('CLASS')).toBe('Classe');
    expect(component.formatType('PROCESS')).toBe('Processo');
    expect(component.formatType('DOCUMENT')).toBe('Documento');
    expect(component.formatType('UNKNOWN')).toBe('UNKNOWN');
  });
});
