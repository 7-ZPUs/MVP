import { TestBed } from '@angular/core/testing';
import { ImportState } from './import.state';
import { ImportPhase, StatoIndicizzazione } from './enums';
import { describe, it, expect, beforeEach } from 'vitest';

describe('ImportState', () => {
  let state: ImportState;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ImportState]
    });
    state = TestBed.inject(ImportState);
  });

  it('dovrebbe partire con lo stato INITIAL', () => {
    expect(state.phase()).toBe(ImportPhase.IDLE);
    expect(state.rootNodes()).toEqual([]);
    expect(state.loading()).toBe(false);
  });

  it('setRootNodes dovrebbe impostare fase READY se ci sono nodi', () => {
    const mockNodes = [{ id: '1', label: 'Test' }] as any;
    state.setRootNodes(mockNodes);

    expect(state.rootNodes()).toEqual(mockNodes);
    expect(state.phase()).toBe(ImportPhase.READY);
    expect(state.isEmpty()).toBe(false);
  });

  it('setRootNodes dovrebbe impostare fase EMPTY se l\'array è vuoto', () => {
    state.setRootNodes([]);
    expect(state.phase()).toBe(ImportPhase.EMPTY);
    expect(state.isEmpty()).toBe(true);
  });

  it('setChildrenForNode dovrebbe popolare la cache senza perdere i dati esistenti', () => {
    const children1 = [{ id: 'child1' }] as any;
    const children2 = [{ id: 'child2' }] as any;

    state.setChildrenForNode('parent1', children1);
    state.setChildrenForNode('parent2', children2);

    const cache = state.nodeCache();
    expect(cache.get('parent1')).toEqual(children1);
    expect(cache.get('parent2')).toEqual(children2);
    expect(cache.size).toBe(2);
  });

  it('setError dovrebbe cambiare la fase in ERROR e spegnere il loading', () => {
    state.setLoading(true);
    state.setError({ message: 'Errore fatale' } as any);

    expect(state.phase()).toBe(ImportPhase.ERROR);
    expect(state.loading()).toBe(false);
    expect(state.error()?.message).toBe('Errore fatale');
  });

  it('reset dovrebbe ripulire completamente anche le Map', () => {
    state.setChildrenForNode('1', [{ id: 'child' }] as any);
    state.setIndicizzazione(StatoIndicizzazione.COMPLETATA);
    
    state.reset();

    expect(state.nodeCache().size).toBe(0);
    expect(state.indicizzazione()).toBe(StatoIndicizzazione.NON_COMPLETATA);
    expect(state.phase()).toBe(ImportPhase.IDLE);
  });
});