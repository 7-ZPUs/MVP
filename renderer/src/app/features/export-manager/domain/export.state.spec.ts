import { TestBed } from '@angular/core/testing';
import { ExportState } from './export.state';
import { ExportPhase, OutputContext } from './enums';
import { describe, it, expect, beforeEach } from 'vitest';

describe('ExportState', () => {
  let state: ExportState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExportState]
    });
    state = TestBed.inject(ExportState);
  });

  it('dovrebbe partire con lo stato INITIAL', () => {
    expect(state.phase()).toBe(ExportPhase.IDLE);
    expect(state.loading()).toBe(false);
    expect(state.progress()).toBe(0);
  });

  it('setProcessing dovrebbe attivare il caricamento e resettare il progresso', () => {
    state.setProcessing(OutputContext.SINGLE_EXPORT);
    
    expect(state.phase()).toBe(ExportPhase.PROCESSING);
    expect(state.loading()).toBe(true);
    expect(state.outputContext()).toBe(OutputContext.SINGLE_EXPORT);
    expect(state.progress()).toBe(0);
  });

  it('setProgress dovrebbe arrotondare i valori e non superare 100', () => {
    state.setProgress(45.7);
    expect(state.progress()).toBe(46);

    state.setProgress(150);
    expect(state.progress()).toBe(100);
  });

  it('setSuccess dovrebbe impostare la fase SUCCESS e spegnere il loading', () => {
    const mockResult = { successCount: 1 } as any;
    state.setSuccess(mockResult);

    expect(state.phase()).toBe(ExportPhase.SUCCESS);
    expect(state.result()).toEqual(mockResult);
    expect(state.loading()).toBe(false);
    expect(state.progress()).toBe(100);
  });

  it('setError dovrebbe impostare la fase ERROR', () => {
    const mockError = { message: 'Errore' } as any;
    state.setError(mockError);

    expect(state.phase()).toBe(ExportPhase.ERROR);
    expect(state.error()).toEqual(mockError);
    expect(state.loading()).toBe(false);
  });

  it('reset dovrebbe riportare lo stato all\'origine', () => {
    state.setProcessing(OutputContext.MULTI_EXPORT);
    state.reset();

    expect(state.phase()).toBe(ExportPhase.IDLE);
    expect(state.loading()).toBe(false);
    expect(state.outputContext()).toBeNull();
  });
});