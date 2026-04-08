import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ExportResultComponent } from './export-result.component';
import { ExportErrorCode, ExportPhase, OutputContext } from '../../../domain/enums';
import { ExportResult, ExportError } from '../../../domain/models';
import { ErrorCategory } from '../../../../../shared/domain/error.enum';

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeResult(overrides: Partial<ExportResult> = {}): ExportResult {
  return {
    successCount: 1,
    failedCount: 0,
    totalDocuments: 1,
    outputContext: OutputContext.SINGLE_EXPORT,
    destPath: '/tmp/documento.pdf',
    errors: [],
    isFullSuccess: true,
    ...overrides,
  };
}

function makeError(overrides: Partial<ExportError> = {}): ExportError {
  return {
    detail: '',
    code: ExportErrorCode.PRINT_FAILED,
    category: ErrorCategory.PRINT,
    context: 'export',
    message: 'Qualcosa è andato storto',
    recoverable: false,
    ...overrides,
  };
}

// ─── Suite ──────────────────────────────────────────────────────────────────

describe('ExportResultComponent', () => {
  let fixture: ComponentFixture<ExportResultComponent>;
  let component: ExportResultComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExportResultComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ExportResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Default state ──────────────────────────────────────────────────────────

  describe('stato iniziale (IDLE)', () => {
    it('non renderizza nulla con phase IDLE', () => {
      expect(fixture.nativeElement.querySelector('.result-box')).toBeNull();
    });

    it('il phase di default è IDLE', () => {
      expect(component.phase()).toBe(ExportPhase.IDLE);
    });

    it('result e error sono null di default', () => {
      expect(component.result()).toBeNull();
      expect(component.error()).toBeNull();
    });
  });

  // ── SUCCESS ────────────────────────────────────────────────────────────────

  describe('phase SUCCESS', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('phase', ExportPhase.SUCCESS);
      fixture.componentRef.setInput('result', makeResult());
      fixture.detectChanges();
    });

    it('mostra il box success', () => {
      expect(fixture.nativeElement.querySelector('.result-success')).not.toBeNull();
    });

    it('non mostra box error o warning', () => {
      expect(fixture.nativeElement.querySelector('.result-error')).toBeNull();
      expect(fixture.nativeElement.querySelector('.result-warning')).toBeNull();
    });

    it('ha role="status" e aria-live="polite"', () => {
      const box = fixture.nativeElement.querySelector('.result-success');
      expect(box.getAttribute('role')).toBe('status');
      expect(box.getAttribute('aria-live')).toBe('polite');
    });

    it('non mostra il contatore elementi falliti se failedCount === 0', () => {
      expect(fixture.nativeElement.querySelector('.result-sub')).toBeNull();
    });

    it('mostra il contatore elementi falliti se failedCount > 0', () => {
      fixture.componentRef.setInput('result', makeResult({ failedCount: 3 }));
      fixture.detectChanges();
      const sub = fixture.nativeElement.querySelector('.result-sub');
      expect(sub).not.toBeNull();
      expect(sub.textContent).toContain('3 elementi non salvati');
    });

    it('non mostra nulla se result è null anche con phase SUCCESS', () => {
      fixture.componentRef.setInput('result', null);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.result-success')).toBeNull();
    });
  });

  // ── successMessage ─────────────────────────────────────────────────────────

  describe('successMessage', () => {
    it('restituisce stringa vuota se result è null', () => {
      fixture.componentRef.setInput('result', null);
      expect(component.successMessage()).toBe('');
    });

    const cases: Array<[OutputContext, string | ((r: ExportResult) => string)]> = [
      [OutputContext.SINGLE_EXPORT, 'Documento salvato con successo'],
      [OutputContext.SINGLE_PRINT,  'Documento aperto con lettore predefinito'],
      [OutputContext.REPORT_PDF,    'Report PDF esportato con successo'],
      [OutputContext.MULTI_EXPORT,  (r) => `${r.successCount} documenti salvati`],
      [OutputContext.MULTI_PRINT,   (r) => `${r.successCount} documenti aperti con lettore predefinito`],
    ];

    cases.forEach(([ctx, expected]) => {
      it(`OutputContext.${ctx}`, () => {
        const result = makeResult({ outputContext: ctx, successCount: 5 });
        fixture.componentRef.setInput('result', result);
        const msg = typeof expected === 'function' ? expected(result) : expected;
        expect(component.successMessage()).toBe(msg);
      });
    });

    it('restituisce "Operazione completata" per outputContext sconosciuto', () => {
      fixture.componentRef.setInput('result', makeResult({ outputContext: 'UNKNOWN' as OutputContext }));
      expect(component.successMessage()).toBe('Operazione completata');
    });

    it('il messaggio compare nel template come aria-label', () => {
      fixture.componentRef.setInput('phase', ExportPhase.SUCCESS);
      fixture.componentRef.setInput('result', makeResult({ outputContext: OutputContext.SINGLE_EXPORT }));
      fixture.detectChanges();
      const box = fixture.nativeElement.querySelector('.result-success');
      expect(box.getAttribute('aria-label')).toBe('Documento salvato con successo');
    });
  });

  // ── ERROR ──────────────────────────────────────────────────────────────────

  describe('phase ERROR', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('phase', ExportPhase.ERROR);
      fixture.componentRef.setInput('error', makeError());
      fixture.detectChanges();
    });

    it('mostra il box error', () => {
      expect(fixture.nativeElement.querySelector('.result-error')).not.toBeNull();
    });

    it('non mostra box success o warning', () => {
      expect(fixture.nativeElement.querySelector('.result-success')).toBeNull();
      expect(fixture.nativeElement.querySelector('.result-warning')).toBeNull();
    });

    it('ha role="alert" e aria-live="assertive"', () => {
      const box = fixture.nativeElement.querySelector('.result-error');
      expect(box.getAttribute('role')).toBe('alert');
      expect(box.getAttribute('aria-live')).toBe('assertive');
    });

    it('mostra il messaggio di errore', () => {
      const title = fixture.nativeElement.querySelector('.result-error .result-title');
      expect(title.textContent.trim()).toBe('Qualcosa è andato storto');
    });

    it('aria-label contiene "Errore:" e il messaggio', () => {
      const box = fixture.nativeElement.querySelector('.result-error');
      expect(box.getAttribute('aria-label')).toBe('Errore: Qualcosa è andato storto');
    });

    it('non mostra il bottone Riprova se error.recoverable è false', () => {
      expect(fixture.nativeElement.querySelector('.retry-btn')).toBeNull();
    });

    it('mostra il bottone Riprova se error.recoverable è true', () => {
      fixture.componentRef.setInput('error', makeError({ recoverable: true }));
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector('.retry-btn');
      expect(btn).not.toBeNull();
      expect(btn.getAttribute('aria-label')).toBe("Riprova l'operazione");
    });

    it('non mostra nulla se error è null anche con phase ERROR', () => {
      fixture.componentRef.setInput('error', null);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.result-error')).toBeNull();
    });
  });

  // ── retry EventEmitter ─────────────────────────────────────────────────────

  describe('evento retry', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('phase', ExportPhase.ERROR);
      fixture.componentRef.setInput('error', makeError({ recoverable: true }));
      fixture.detectChanges();
    });

    it('emette retry al click del bottone', () => {
      const spy = vi.fn();
      component.retry.subscribe(spy);
      fixture.nativeElement.querySelector('.retry-btn').click();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('emette retry senza payload (void)', () => {
      const emitted: unknown[] = [];
      component.retry.subscribe((v) => emitted.push(v));
      fixture.nativeElement.querySelector('.retry-btn').click();
      expect(emitted[0]).toBeUndefined();
    });
  });

  // ── UNAVAILABLE ────────────────────────────────────────────────────────────

  describe('phase UNAVAILABLE', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('phase', ExportPhase.UNAVAILABLE);
      fixture.componentRef.setInput('error', makeError({ message: 'Funzione non disponibile' }));
      fixture.detectChanges();
    });

    it('mostra il box warning', () => {
      expect(fixture.nativeElement.querySelector('.result-warning')).not.toBeNull();
    });

    it('non mostra box success o error', () => {
      expect(fixture.nativeElement.querySelector('.result-success')).toBeNull();
      expect(fixture.nativeElement.querySelector('.result-error')).toBeNull();
    });

    it('ha role="status" e aria-live="polite"', () => {
      const box = fixture.nativeElement.querySelector('.result-warning');
      expect(box.getAttribute('role')).toBe('status');
      expect(box.getAttribute('aria-live')).toBe('polite');
    });

    it('mostra il messaggio di errore', () => {
      const title = fixture.nativeElement.querySelector('.result-warning .result-title');
      expect(title.textContent.trim()).toBe('Funzione non disponibile');
    });

    it('aria-label contiene "Operazione non disponibile:" e il messaggio', () => {
      const box = fixture.nativeElement.querySelector('.result-warning');
      expect(box.getAttribute('aria-label')).toBe(
        'Operazione non disponibile: Funzione non disponibile',
      );
    });

    it('non mostra il bottone Riprova nel warning', () => {
      expect(fixture.nativeElement.querySelector('.retry-btn')).toBeNull();
    });

    it('non mostra nulla se error è null anche con phase UNAVAILABLE', () => {
      fixture.componentRef.setInput('error', null);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.result-warning')).toBeNull();
    });
  });

  // ── Accessibilità ──────────────────────────────────────────────────────────

  describe('accessibilità', () => {
    it('le icone hanno aria-hidden="true"', () => {
      fixture.componentRef.setInput('phase', ExportPhase.SUCCESS);
      fixture.componentRef.setInput('result', makeResult());
      fixture.detectChanges();
      const icon = fixture.nativeElement.querySelector('[aria-hidden="true"]');
      expect(icon).not.toBeNull();
    });

    it('lo span result-sub in SUCCESS ha role="alert" e aria-live="assertive"', () => {
      fixture.componentRef.setInput('phase', ExportPhase.SUCCESS);
      fixture.componentRef.setInput('result', makeResult({ failedCount: 2 }));
      fixture.detectChanges();
      const sub = fixture.nativeElement.querySelector('.result-sub');
      expect(sub.getAttribute('role')).toBe('alert');
      expect(sub.getAttribute('aria-live')).toBe('assertive');
    });

    it('aria-atomic è true su tutti i box', () => {
      const phases = [
        { phase: ExportPhase.SUCCESS,     result: makeResult(), error: null },
        { phase: ExportPhase.ERROR,       result: null,         error: makeError() },
        { phase: ExportPhase.UNAVAILABLE, result: null,         error: makeError() },
      ];

      phases.forEach(({ phase, result, error }) => {
        fixture.componentRef.setInput('phase',  phase);
        fixture.componentRef.setInput('result', result);
        fixture.componentRef.setInput('error',  error);
        fixture.detectChanges();
        const box = fixture.nativeElement.querySelector('.result-box');
        expect(box.getAttribute('aria-atomic')).toBe('true');
      });
    });
  });
});