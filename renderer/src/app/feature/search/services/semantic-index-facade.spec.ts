import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Subject } from 'rxjs';
import { SemanticIndexFacade } from './semantic-index-facade';
import { IIndexingChannel, INDEXING_CHANNEL_TOKEN } from '../contracts/semantic-index.interface';
import { SemanticIndexState } from '../../../../../../shared/metadata/semantic-filter-models';
import { IndexingStatus } from '../../../../../../shared/metadata/search.enum';
import { TestBed } from '@angular/core/testing';

describe('SemanticIndexFacade', () => {
  let facade: SemanticIndexFacade;
  let mockIpcGateway: IIndexingChannel;
  let statusSubject: Subject<SemanticIndexState>;

  beforeEach(() => {
    vi.useFakeTimers();

    statusSubject = new Subject<SemanticIndexState>();

    mockIpcGateway = {
      getIndexingStatus: vi.fn().mockReturnValue(statusSubject.asObservable()),
    };

    TestBed.configureTestingModule({
      providers: [
        SemanticIndexFacade,
        { provide: INDEXING_CHANNEL_TOKEN, useValue: mockIpcGateway },
      ],
    });

    facade = TestBed.inject(SemanticIndexFacade);
  });

  afterEach(() => {
    statusSubject.complete();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('dovrebbe inizializzarsi con lo stato IDLE', () => {
    const currentState = facade.getStatus()();
    expect(currentState.status).toBe(IndexingStatus.IDLE);
    expect(currentState.progressPercentage).toBe(0);
    expect(mockIpcGateway.getIndexingStatus).toHaveBeenCalledTimes(1);
  });

  it('dovrebbe aggiornare lo stato quando il gateway emette un nuovo valore', () => {
    const newState: SemanticIndexState = {
      status: IndexingStatus.INDEXING,
      progressPercentage: 45,
      lastIndexedAt: null,
    };

    statusSubject.next(newState);

    const currentState = facade.getStatus()();
    expect(currentState.status).toBe(IndexingStatus.INDEXING);
    expect(currentState.progressPercentage).toBe(45);
  });

  it('dovrebbe passare allo stato TIMEOUT se non riceve aggiornamenti per 120 secondi', () => {
    vi.advanceTimersByTime(120_000);

    expect(facade.getStatus()().status).toBe(IndexingStatus.TIMEOUT);
  });

  it('dovrebbe resettare il timer se riceve un aggiornamento prima della scadenza', () => {
    vi.advanceTimersByTime(60_000);

    statusSubject.next({
      status: IndexingStatus.INDEXING,
      progressPercentage: 10,
      lastIndexedAt: null,
    });

    vi.advanceTimersByTime(70_000);
    expect(facade.getStatus()().status).toBe(IndexingStatus.INDEXING);

    vi.advanceTimersByTime(50_000);
    expect(facade.getStatus()().status).toBe(IndexingStatus.TIMEOUT);
  });

  it('dovrebbe fermare il timer se riceve uno stato terminale (READY)', () => {
    statusSubject.next({
      status: IndexingStatus.READY,
      progressPercentage: 100,
      lastIndexedAt: new Date(),
    });

    vi.advanceTimersByTime(150_000);

    expect(facade.getStatus()().status).toBe(IndexingStatus.READY);
  });

  it("dovrebbe fermare il timer e impostare lo stato su ERROR se l'observable va in errore", () => {
    statusSubject.error(new Error('Connessione IPC persa'));

    expect(facade.getStatus()().status).toBe(IndexingStatus.ERROR);

    vi.advanceTimersByTime(150_000);
    expect(facade.getStatus()().status).toBe(IndexingStatus.ERROR);
  });
});
