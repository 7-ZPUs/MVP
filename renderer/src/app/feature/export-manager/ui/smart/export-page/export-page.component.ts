import { Component, computed, effect, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExportFacade } from '../../../services/export.facade';
import { ExportPhase, OutputContext } from '../../../domain/enums';
import { ExportResultComponent } from '../../../ui/dumb/export-result/export-result.component';
import { ExportProgressComponent } from '../../../ui/dumb/export-progress/export-progress.component';
import { ExportIpcGateway } from '../../../infrastructure/export-ipc-gateway.service';
import { FileDTO } from '../../../domain/dtos';

@Component({
  selector: 'app-export-page',
  standalone: true,
  imports: [CommonModule, ExportResultComponent, ExportProgressComponent],
  templateUrl: './export-page.component.html',
  styleUrl: './export-page.component.scss',
})
export class ExportPageComponent implements OnInit {
  documentId = input.required<string>();
  itemType = input.required<'DOCUMENT' | 'AGGREGATE' | 'PROCESS'>();

  private readonly exportFacade = inject(ExportFacade);
  private readonly ipcGateway = inject(ExportIpcGateway);
  private readonly _fileIds = signal<number[]>([]);

  readonly phase = this.exportFacade.phase;
  readonly outputContext = this.exportFacade.outputContext;
  readonly result = this.exportFacade.result;
  readonly progress = this.exportFacade.progress;
  readonly error = this.exportFacade.error;
  readonly loading = this.exportFacade.loading;
  readonly queue = this.exportFacade.queue;
  readonly ExportPhase = ExportPhase;

  readonly isWorking = computed(() => this.loading());
  readonly isMulti = computed(() => this._fileIds().length > 1);

  // ----------------------------------------------------------------
  // Stato UI (signal modificabili)
  // ----------------------------------------------------------------

  showProgress = signal(false);
  showQueue = signal(false);
  showResult = signal(false);

  // Flag per sapere se ci sono file stampabili
  readonly hasPrintableFiles = signal(false);

  constructor() {
    // Reset completo al cambio di documentId
    effect(() => {
      this.documentId(); // traccia l'input
      this.exportFacade.reset();
      this.showResult.set(false);
      this.showQueue.set(false);
      this.showProgress.set(false);
    });

    // Mostra automaticamente la coda quando arrivano elementi
    effect(() => {
      if (this.queue().length > 0) {
        this.showQueue.set(true);
      }
    });

    // Mostra il progresso durante un'esportazione multi‑file
    effect(() => {
      const loading = this.loading();
      const ctx = this.outputContext();
      const multi = this.isMulti();

      if (loading && multi && ctx === OutputContext.MULTI_EXPORT) {
        this.showProgress.set(true);
      } else if (!loading) {
        this.showProgress.set(false);
      }
      // Se loading è true ma le altre condizioni non sono soddisfatte,
      // non modifichiamo showProgress (l'utente potrebbe averlo chiuso manualmente)
    });

    // Mostra il pannello del risultato quando la fase diventa terminale
    effect(() => {
      const phase = this.phase();
      if (phase === ExportPhase.IDLE || phase === ExportPhase.PROCESSING) {
        this.showResult.set(false);
      } else {
        this.showResult.set(true);
      }
    });
  }

  async ngOnInit(): Promise<void> {
    const docId = Number(this.documentId());
    if (isNaN(docId)) return;

    const files = await this.ipcGateway.getFilesByDocumentId(docId);
    this._fileIds.set(files.map(f => f.id));

    const printable = files.filter(f =>
      ['pdf', 'png', 'jpg', 'jpeg'].some(ext =>
        f.filename.toLowerCase().endsWith(`.${ext}`)
      )
    );
    this.hasPrintableFiles.set(printable.length > 0);
  }

  onRetry(): void {
    this.exportFacade.reset();
  }

  // ----------------------------------------------------------------
  // Stampa
  // ----------------------------------------------------------------

  readonly printableFiles = signal<FileDTO[]>([]);
  readonly selectedPrintIds = signal<Set<number>>(new Set());
  readonly showPrintSelector = signal(false);
  readonly selectedPrintCount = computed(() => this.selectedPrintIds().size);

  async onPrint(): Promise<void> {
    const docId = Number(this.documentId());
    if (isNaN(docId)) return;

    const files = await this.ipcGateway.getFilesByDocumentId(docId);
    const printable = files.filter(f =>
      ['pdf', 'png', 'jpg', 'jpeg'].some(ext =>
        f.filename.toLowerCase().endsWith(`.${ext}`)
      )
    );

    if (printable.length === 0) return;

    if (printable.length === 1) {
      await this.exportFacade.printDocument(printable[0].id);
      return;
    }

    this.printableFiles.set(printable);
    this.selectedPrintIds.set(new Set(printable.map(f => f.id)));
    this.showPrintSelector.set(true);
  }

  togglePrintFile(fileId: number): void {
    const current = new Set(this.selectedPrintIds());
    if (current.has(fileId)) {
      current.delete(fileId);
    } else {
      current.add(fileId);
    }
    this.selectedPrintIds.set(current);
  }

  async confirmPrint(): Promise<void> {
    const ids = [...this.selectedPrintIds()];
    if (ids.length === 0) return;
    this.showPrintSelector.set(false);
    await this.exportFacade.printDocuments(ids);
  }

  cancelPrint(): void {
    this.showPrintSelector.set(false);
    this.printableFiles.set([]);
    this.selectedPrintIds.set(new Set());
  }

  // ----------------------------------------------------------------
  // Download (esportazione)
  // ----------------------------------------------------------------

  readonly downloadableFiles = signal<FileDTO[]>([]);
  readonly selectedDownloadIds = signal<Set<number>>(new Set());
  readonly showDownloadSelector = signal(false);
  readonly selectedDownloadCount = computed(() => this.selectedDownloadIds().size);

  async onExport(): Promise<void> {
    const docId = Number(this.documentId());
    if (isNaN(docId)) return;

    const files = await this.ipcGateway.getFilesByDocumentId(docId);
    if (files.length === 0) return;

    if (files.length === 1) {
      await this.exportFacade.exportFile(files[0].id);
      return;
    }

    this.downloadableFiles.set(files);
    this.selectedDownloadIds.set(new Set(files.map(f => f.id)));
    this.showDownloadSelector.set(true);
  }

  toggleDownloadFile(fileId: number): void {
    const current = new Set(this.selectedDownloadIds());
    if (current.has(fileId)) {
      current.delete(fileId);
    } else {
      current.add(fileId);
    }
    this.selectedDownloadIds.set(current);
  }

  getBaseName(filename: string): string {
    const parts = filename.split('/');
    return parts[parts.length - 1] || filename;
  }

  async confirmDownload(): Promise<void> {
    const ids = [...this.selectedDownloadIds()];
    if (ids.length === 0) return;
    this.showDownloadSelector.set(false);
    if (ids.length === 1) {
      await this.exportFacade.exportFile(ids[0]);
    } else {
      await this.exportFacade.exportFiles(ids);
    }
  }

  cancelDownload(): void {
    this.showDownloadSelector.set(false);
    this.downloadableFiles.set([]);
    this.selectedDownloadIds.set(new Set());
  }
}