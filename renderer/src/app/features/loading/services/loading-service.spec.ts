import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NgZone } from '@angular/core';
import { LoadingService } from './loading-service';
import { IpcChannels } from '@shared/ipc-channels';
import { BOOTSTRAP_LOADING_STATUS, BootstrapStatus } from '@shared/bootstrap-status';
import { vi, describe, it, expect, beforeEach, afterEach, Mock } from 'vitest';

describe('LoadingService', () => {
  let mockNgZone: { run: Mock };
  let originalWindow: any;

  beforeEach(() => {
    originalWindow = { ...globalThis.window };
    mockNgZone = {
      run: vi.fn((fn: () => void) => fn()),
    };

    TestBed.configureTestingModule({
      providers: [LoadingService, { provide: NgZone, useValue: mockNgZone }],
    });
  });

  afterEach(() => {
    Object.keys(globalThis.window as any).forEach((key) => {
      delete (globalThis.window as any)[key];
    });
    Object.assign(globalThis.window as any, originalWindow);
    vi.restoreAllMocks();
  });

  it('should create and warn when no electron bridge is available', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const service = TestBed.inject(LoadingService);

    expect(service).toBeTruthy();
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[LoadingService] electron bridge non disponibile nel renderer.',
    );
  });

  it('should attach BOOTSTRAP_COMPLETE listener via "on" and sync status if bridge exists', fakeAsync(() => {
    const invokeMock = vi.fn().mockResolvedValue({ state: 'success' });
    const onMock = vi.fn();

    (globalThis.window as any).electronAPI = {
      invoke: invokeMock,
      on: onMock,
    };

    const service = TestBed.inject(LoadingService);
    tick(); // resolve the async syncBootstrapStatus

    expect(onMock).toHaveBeenCalledWith(IpcChannels.BOOTSTRAP_COMPLETE, expect.any(Function));
    expect(invokeMock).toHaveBeenCalledWith(IpcChannels.BOOTSTRAP_STATUS);
    expect(mockNgZone.run).toHaveBeenCalled();

    let emittedStatus: BootstrapStatus | undefined;
    service.bootstrapStatus$.subscribe((s) => (emittedStatus = s));
    expect(emittedStatus).toEqual({ state: 'success' });
  }));

  it('should attach BOOTSTRAP_COMPLETE listener via "receive" if "on" is not available', () => {
    const receiveMock = vi.fn();
    (globalThis.window as any).electron = {
      receive: receiveMock,
      invoke: vi.fn(),
    };

    TestBed.inject(LoadingService);
    expect(receiveMock).toHaveBeenCalledWith(IpcChannels.BOOTSTRAP_COMPLETE, expect.any(Function));
  });

  it('should handle boolean true status correctly (mapped to success)', fakeAsync(() => {
    const invokeMock = vi.fn().mockResolvedValue(true);
    (globalThis.window as any).api = { invoke: invokeMock, on: vi.fn() };

    const service = TestBed.inject(LoadingService);
    tick();

    let emittedStatus: BootstrapStatus | undefined;
    service.bootstrapStatus$.subscribe((s) => (emittedStatus = s));
    expect(emittedStatus).toEqual({ state: 'success' });
  }));

  it('should handle boolean false status correctly (mapped to loading)', fakeAsync(() => {
    const invokeMock = vi.fn().mockResolvedValue(false);
    (globalThis.window as any).electronAPI = { invoke: invokeMock };

    const service = TestBed.inject(LoadingService);
    // update status to something else first to see if loading overwrites it
    (service as any).bootstrapStatusSubject.next({ state: 'success' });

    tick();

    let emittedStatus: BootstrapStatus | undefined;
    service.bootstrapStatus$.subscribe((s) => (emittedStatus = s));
    expect(emittedStatus).toEqual(BOOTSTRAP_LOADING_STATUS);
  }));

  it('should handle error during syncBootstrapStatus', fakeAsync(() => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = new Error('IPC failed');
    const invokeMock = vi.fn().mockRejectedValue(error);
    (globalThis.window as any).electronAPI = { invoke: invokeMock };

    TestBed.inject(LoadingService);
    tick();

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '[LoadingService] impossibile leggere lo stato bootstrap:',
      error,
    );
  }));

  it('should call applyStatus when BOOTSTRAP_COMPLETE event is received', fakeAsync(() => {
    let bootstrapCompleteHandler: (...args: unknown[]) => void = () => {};
    const onMock = vi.fn((channel, handler) => {
      if (channel === IpcChannels.BOOTSTRAP_COMPLETE) {
        bootstrapCompleteHandler = handler;
      }
    });

    (globalThis.window as any).electronAPI = {
      invoke: vi.fn().mockResolvedValue(BOOTSTRAP_LOADING_STATUS),
      on: onMock,
    };

    const service = TestBed.inject(LoadingService);
    tick(); // resolve the initial sync

    // emit from event
    mockNgZone.run.mockClear();
    bootstrapCompleteHandler({ state: 'failure', message: 'Failed to start' });

    expect(mockNgZone.run).toHaveBeenCalled();
    let emittedStatus: BootstrapStatus | undefined;
    service.bootstrapStatus$.subscribe((s) => (emittedStatus = s));
    expect(emittedStatus).toEqual({ state: 'failure', message: 'Failed to start' });
  }));

  it('should not emit same status continuously', fakeAsync(() => {
    let bootstrapCompleteHandler: (...args: unknown[]) => void = () => {};
    const onMock = vi.fn((channel, handler) => {
      bootstrapCompleteHandler = handler;
    });

    (globalThis.window as any).electronAPI = {
      invoke: vi.fn().mockResolvedValue({ state: 'loading' }),
      on: onMock,
    };

    const service = TestBed.inject(LoadingService);
    tick(); // sync

    let emissions = 0;
    service.bootstrapStatus$.subscribe(() => emissions++);
    // initially we get 1 emission from the behavior subject immediate subscribe

    emissions = 0;
    bootstrapCompleteHandler({ state: 'loading' }); // should be ignored
    bootstrapCompleteHandler({ state: 'loading' }); // should be ignored
    expect(emissions).toBe(0);

    bootstrapCompleteHandler({ state: 'loading', message: 'test' }); // state is same, message changes -> emit
    expect(emissions).toBe(1);

    bootstrapCompleteHandler({ state: 'success', message: 'test' }); // state changes -> emit
    expect(emissions).toBe(2);
  }));

  it('should do nothing if syncBootstrapStatus bridge invoke is not a function', fakeAsync(() => {
    (globalThis.window as any).electronAPI = {
      invoke: 'not a function',
      on: vi.fn(),
    };

    TestBed.inject(LoadingService);
    tick();

    expect(mockNgZone.run).not.toHaveBeenCalled();
  }));

  it('should ignore invalid objects passed to applyStatus', fakeAsync(() => {
    const invokeMock = vi.fn().mockResolvedValue({ invalidField: true });
    (globalThis.window as any).electronAPI = { invoke: invokeMock, on: vi.fn() };

    const service = TestBed.inject(LoadingService);
    tick();

    let emittedStatus: BootstrapStatus | undefined;
    service.bootstrapStatus$.subscribe((s) => (emittedStatus = s));

    // fallback to original behavior subject value because applyStatus did not use setStatus
    expect(emittedStatus).toEqual(BOOTSTRAP_LOADING_STATUS);
  }));
});
