import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ExportPageComponent } from './export-page.component';
import { ExportFacade } from '../../../services/export.facade';
import { ExportIpcGateway } from '../../../infrastructure/export-ipc-gateway.service';
import { ExportPhase, OutputContext } from '../../../domain/enums';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ExportError, ExportResult } from '../../../domain/models';
import { FileDTO } from '../../../domain/dtos';
import { ExportState } from '../../../domain/export.state';

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------

function makeFile(overrides: Partial<FileDTO> = {}): FileDTO {
  return {
    id: 1,
    filename: 'documento.pdf',
    path: '/tmp/documento.pdf',
    isMain: true,
    hash: 'abc123',
    integrityStatus: 'valid',
    documentId: 42,
    ...overrides,
  };
}

// ----------------------------------------------------------------
// Mock Facade
// ----------------------------------------------------------------

function makeMockFacade() {
  return {
    phase: signal<ExportPhase>(ExportPhase.IDLE),
    outputContext: signal<OutputContext | null>(null),
    result: signal<ExportResult | null>(null),
    progress: signal<number>(0),
    error: signal<ExportError | null>(null),
    loading: signal<boolean>(false),
    queue: signal<any[]>([]),
    exportFile: vi.fn().mockResolvedValue(undefined),
    exportFiles: vi.fn().mockResolvedValue(undefined),
    printDocument: vi.fn().mockResolvedValue(undefined),
    printDocuments: vi.fn().mockResolvedValue(undefined),
    reset: vi.fn(),
  };
}

// ----------------------------------------------------------------
// Mock Gateway
// ----------------------------------------------------------------

function makeMockGateway(files: FileDTO[] = [makeFile()]) {
  return {
    getFilesByDocumentId: vi.fn().mockResolvedValue(files),
    getFileDto: vi.fn().mockResolvedValue(makeFile()),
  };
}

// ----------------------------------------------------------------
// Setup
// ----------------------------------------------------------------

async function setup(files: FileDTO[] = [makeFile()]) {
  const mockFacade = makeMockFacade();
  const mockGateway = makeMockGateway(files);

  await TestBed.configureTestingModule({
    imports: [ExportPageComponent],
    providers: [{ provide: ExportIpcGateway, useValue: mockGateway }],
  })
    .overrideComponent(ExportPageComponent, {
      remove: {
        providers: [ExportFacade, ExportState],
      },
      add: {
        providers: [
          { provide: ExportFacade, useValue: mockFacade },
          { provide: ExportIpcGateway, useValue: mockGateway },
        ],
      },
    })
    .compileComponents();

  const fixture = TestBed.createComponent(ExportPageComponent);
  const component = fixture.componentInstance;

  fixture.componentRef.setInput('documentId', '42');

  await fixture.whenStable();
  fixture.detectChanges();

  return { fixture, component, mockFacade, mockGateway };
}

// ================================================================

describe('ExportPageComponent', () => {
  // --------------------------------------------------------------
  // Inizializzazione
  // --------------------------------------------------------------

  describe('ngOnInit', () => {
    it('carica i fileIds dal gateway usando il documentId in input', async () => {
      const { mockGateway } = await setup();
      expect(mockGateway.getFilesByDocumentId).toHaveBeenCalledWith(42);
    });

    it('non chiama il gateway se documentId non è un numero valido', async () => {
      const mockFacade = makeMockFacade();
      const mockGateway = makeMockGateway();

      await TestBed.configureTestingModule({
        imports: [ExportPageComponent],
        providers: [{ provide: ExportIpcGateway, useValue: mockGateway }],
      })
        .overrideComponent(ExportPageComponent, {
          remove: { providers: [ExportFacade, ExportState] },
          add: {
            providers: [
              { provide: ExportFacade, useValue: mockFacade },
              { provide: ExportIpcGateway, useValue: mockGateway },
            ],
          },
        })
        .compileComponents();

      const fixture = TestBed.createComponent(ExportPageComponent);
      fixture.componentRef.setInput('documentId', 'non-un-numero');
      await fixture.whenStable();

      expect(mockGateway.getFilesByDocumentId).not.toHaveBeenCalled();
    });

    it('chiama reset della facade al cambio di documentId', async () => {
      const { fixture, mockFacade } = await setup();
      mockFacade.reset.mockClear();

      fixture.componentRef.setInput('documentId', '99');
      await fixture.whenStable();

      expect(mockFacade.reset).toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------
  // Overlays: progress, queue, result
  // --------------------------------------------------------------

  describe('overlay progress', () => {
    it('è visibile durante loading + multi-file', async () => {
      const files = [makeFile({ id: 1 }), makeFile({ id: 2, filename: 'b.pdf' })];
      const { fixture, mockFacade, component } = await setup(files);

      component.isDownloading.set(true);
      mockFacade.outputContext.set(OutputContext.MULTI_EXPORT);
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('app-export-progress'))).not.toBeNull();
    });

    it('non è visibile con un solo file', async () => {
      const { fixture, component } = await setup([makeFile()]);

      component.isDownloading.set(true);
      // outputContext rimane null (diverso da MULTI_EXPORT)
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('app-export-progress'))).toBeNull();
    });
  });

  describe('overlay queue', () => {
    it('mostra la coda quando ci sono elementi', async () => {
      const { fixture, mockFacade } = await setup();

      mockFacade.queue.set([{ fileId: 1, filename: 'a.pdf', status: 'pending' }]);
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('.queue-container'))).not.toBeNull();
    });

    it('nasconde la coda al click su close', async () => {
      const { fixture, mockFacade } = await setup();

      mockFacade.queue.set([{ fileId: 1, filename: 'a.pdf', status: 'done' }]);
      fixture.detectChanges();

      fixture.debugElement.query(By.css('.close-all-btn')).nativeElement.click();
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('.queue-container'))).toBeNull();
    });
  });

  describe('overlay result', () => {
    it('è visibile quando la fase è SUCCESS', async () => {
      const { fixture, mockFacade } = await setup();

      mockFacade.phase.set(ExportPhase.SUCCESS);
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('app-export-result'))).not.toBeNull();
    });

    it('non è visibile in fase IDLE', async () => {
      const { fixture } = await setup();
      // Il mockFacade ha phase = IDLE di default
      await fixture.whenStable();
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.css('app-export-result'))).toBeNull();
    });

    it('non è visibile in fase PROCESSING', async () => {
      const { fixture, mockFacade } = await setup();

      mockFacade.phase.set(ExportPhase.PROCESSING);
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('app-export-result'))).toBeNull();
    });

    it('chiama reset al click su retry', async () => {
      const { fixture, mockFacade } = await setup();

      mockFacade.phase.set(ExportPhase.ERROR);
      fixture.detectChanges();

      fixture.debugElement.query(By.css('app-export-result')).triggerEventHandler('retry', null);

      expect(mockFacade.reset).toHaveBeenCalled();
    });

    it('nasconde il result al click su close', async () => {
      const { fixture, mockFacade } = await setup();

      mockFacade.phase.set(ExportPhase.SUCCESS);
      fixture.detectChanges();

      fixture.debugElement.query(By.css('.result-container .close-btn')).nativeElement.click();
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('app-export-result'))).toBeNull();
    });
  });

  // --------------------------------------------------------------
  // Download — file singolo
  // --------------------------------------------------------------

  describe('onExport — file singolo', () => {
    it('chiama exportFile direttamente senza mostrare il selettore', async () => {
      const { component, mockFacade } = await setup([makeFile({ id: 7 })]);

      await component.onExport();

      expect(mockFacade.exportFile).toHaveBeenCalledWith(7);
      expect(component.showDownloadSelector()).toBe(false);
    });
  });

  // --------------------------------------------------------------
  // Download — file multipli
  // --------------------------------------------------------------

  describe('onExport — file multipli', () => {
    const twoFiles = [
      makeFile({ id: 1, filename: 'a.pdf' }),
      makeFile({ id: 2, filename: 'b.docx', isMain: false }),
    ];

    it('mostra il selettore download con tutti i file preselezionati', async () => {
      const { component } = await setup(twoFiles);

      await component.onExport();

      expect(component.showDownloadSelector()).toBe(true);
      expect(component.selectedDownloadIds().has(1)).toBe(true);
      expect(component.selectedDownloadIds().has(2)).toBe(true);
    });

    it('toggleDownloadFile deseleziona e riseleziona un file', async () => {
      const { component } = await setup(twoFiles);
      await component.onExport();

      component.toggleDownloadFile(1);
      expect(component.selectedDownloadIds().has(1)).toBe(false);

      component.toggleDownloadFile(1);
      expect(component.selectedDownloadIds().has(1)).toBe(true);
    });

    it('confirmDownload chiama exportFiles con gli id selezionati', async () => {
      const { component, mockFacade } = await setup(twoFiles);
      await component.onExport();

      await component.confirmDownload();

      expect(mockFacade.exportFiles).toHaveBeenCalledWith([1, 2]);
      expect(component.showDownloadSelector()).toBe(false);
    });

    it('confirmDownload chiama exportFile (singolo) se è rimasto un solo id selezionato', async () => {
      const { component, mockFacade } = await setup(twoFiles);
      await component.onExport();

      component.toggleDownloadFile(2); // deseleziona il secondo
      await component.confirmDownload();

      expect(mockFacade.exportFile).toHaveBeenCalledWith(1);
      expect(mockFacade.exportFiles).not.toHaveBeenCalled();
    });

    it('confirmDownload non fa nulla se nessun file è selezionato', async () => {
      const { component, mockFacade } = await setup(twoFiles);
      await component.onExport();

      component.toggleDownloadFile(1);
      component.toggleDownloadFile(2);
      await component.confirmDownload();

      expect(mockFacade.exportFile).not.toHaveBeenCalled();
      expect(mockFacade.exportFiles).not.toHaveBeenCalled();
    });

    it('cancelDownload chiude il selettore e svuota lo stato', async () => {
      const { component } = await setup(twoFiles);
      await component.onExport();

      component.cancelDownload();

      expect(component.showDownloadSelector()).toBe(false);
      expect(component.downloadableFiles()).toHaveLength(0);
      expect(component.selectedDownloadIds().size).toBe(0);
    });

    it("click sull'overlay chiama cancelDownload", async () => {
      const { fixture, component } = await setup(twoFiles);
      await component.onExport();
      fixture.detectChanges();

      fixture.debugElement
        .query(By.css('.print-selector-overlay'))
        .triggerEventHandler('click', null);

      expect(component.showDownloadSelector()).toBe(false);
    });
  });

  // --------------------------------------------------------------
  // Stampa — file singolo
  // --------------------------------------------------------------

  describe('onPrint — file singolo stampabile', () => {
    it('chiama printDocument direttamente senza mostrare il selettore', async () => {
      const { component, mockFacade } = await setup([makeFile({ id: 3 })]);

      await component.onPrint();

      expect(mockFacade.printDocument).toHaveBeenCalledWith(3);
      expect(component.showPrintSelector()).toBe(false);
    });
  });

  describe('onPrint — nessun file stampabile', () => {
    it('non apre il selettore e non chiama la facade', async () => {
      const { component, mockFacade } = await setup([makeFile({ filename: 'doc.docx' })]);

      await component.onPrint();

      expect(mockFacade.printDocument).not.toHaveBeenCalled();
      expect(component.showPrintSelector()).toBe(false);
    });
  });

  // --------------------------------------------------------------
  // Stampa — file multipli
  // --------------------------------------------------------------

  describe('onPrint — file multipli', () => {
    const twoFiles = [
      makeFile({ id: 10, filename: 'a.pdf' }),
      makeFile({ id: 11, filename: 'b.png', isMain: false }),
    ];

    it('mostra il selettore stampa con tutti i file preselezionati', async () => {
      const { component } = await setup(twoFiles);

      await component.onPrint();

      expect(component.showPrintSelector()).toBe(true);
      expect(component.selectedPrintIds().has(10)).toBe(true);
      expect(component.selectedPrintIds().has(11)).toBe(true);
    });

    it('togglePrintFile deseleziona e riseleziona un file', async () => {
      const { component } = await setup(twoFiles);
      await component.onPrint();

      component.togglePrintFile(10);
      expect(component.selectedPrintIds().has(10)).toBe(false);

      component.togglePrintFile(10);
      expect(component.selectedPrintIds().has(10)).toBe(true);
    });

    it('confirmPrint chiama printDocuments con gli id selezionati', async () => {
      const { component, mockFacade } = await setup(twoFiles);
      await component.onPrint();

      await component.confirmPrint();

      expect(mockFacade.printDocuments).toHaveBeenCalledWith([10, 11]);
      expect(component.showPrintSelector()).toBe(false);
    });

    it('confirmPrint non fa nulla se nessun file è selezionato', async () => {
      const { component, mockFacade } = await setup(twoFiles);
      await component.onPrint();

      component.togglePrintFile(10);
      component.togglePrintFile(11);
      await component.confirmPrint();

      expect(mockFacade.printDocuments).not.toHaveBeenCalled();
    });

    it('cancelPrint chiude il selettore e svuota lo stato', async () => {
      const { component } = await setup(twoFiles);
      await component.onPrint();

      component.cancelPrint();

      expect(component.showPrintSelector()).toBe(false);
      expect(component.printableFiles()).toHaveLength(0);
      expect(component.selectedPrintIds().size).toBe(0);
    });
  });

  // --------------------------------------------------------------
  // selectedCount computed
  // --------------------------------------------------------------

  describe('computed selectedDownloadCount e selectedPrintCount', () => {
    it('selectedDownloadCount riflette la dimensione del Set', async () => {
      const { component } = await setup([
        makeFile({ id: 1 }),
        makeFile({ id: 2, filename: 'b.pdf' }),
      ]);
      await component.onExport();

      expect(component.selectedDownloadCount()).toBe(2);
      component.toggleDownloadFile(1);
      expect(component.selectedDownloadCount()).toBe(1);
    });

    it('selectedPrintCount riflette la dimensione del Set', async () => {
      const { component } = await setup([
        makeFile({ id: 10, filename: 'a.pdf' }),
        makeFile({ id: 11, filename: 'b.png', isMain: false }),
      ]);
      await component.onPrint();

      expect(component.selectedPrintCount()).toBe(2);
      component.togglePrintFile(10);
      expect(component.selectedPrintCount()).toBe(1);
    });
  });
});
