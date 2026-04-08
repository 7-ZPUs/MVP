import { Component, computed, effect, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExportFacade } from '../../../services/export.facade';
import { ExportPhase } from '../../../domain/enums';
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
  showQueue    = signal(true);
  showResult   = signal(true);
  showProgress = signal(true);

  documentId = input.required<string>();
  itemType   = input.required<'DOCUMENT' | 'AGGREGATE' | 'DOCUMENT_ATTACHED'>();

  private readonly exportFacade = inject(ExportFacade);
  private readonly ipcGateway   = inject(ExportIpcGateway);
  private readonly _fileIds     = signal<number[]>([]);

  readonly phase         = this.exportFacade.phase;
  readonly outputContext = this.exportFacade.outputContext;
  readonly result        = this.exportFacade.result;
  readonly progress      = this.exportFacade.progress;
  readonly error         = this.exportFacade.error;
  readonly loading       = this.exportFacade.loading;
  readonly queue         = this.exportFacade.queue;
  readonly ExportPhase   = ExportPhase;

  readonly isWorking = computed(() => this.loading());
  readonly isMulti   = computed(() => this._fileIds().length > 1);

  constructor() {
    effect(() => {
      this.documentId();
      this.exportFacade.reset();
      this.showQueue.set(false);
      this.showResult.set(false);
      this.showProgress.set(false);
    });

    effect(() => {
      const phase = this.phase();
      if (phase !== ExportPhase.IDLE) this.showResult.set(true);
    });

    effect(() => {
      if (this.queue().length > 0) this.showQueue.set(true);
    });
  }

  async ngOnInit(): Promise<void> {
    const docId = Number(this.documentId());
    if (isNaN(docId)) return;
    const files = await this.ipcGateway.getFilesByDocumentId(docId);
    this._fileIds.set(files.map(f => f.id));

    // Controlla se esiste almeno un file stampabile
    const printable = files.filter(f =>
      ['pdf', 'png', 'jpg', 'jpeg'].some(ext => f.filename.toLowerCase().endsWith(`.${ext}`))
    );
    this.hasPrintableFiles.set(printable.length > 0);
  }

  closeQueue()  { this.showQueue.set(false); }
  closeResult() { this.showResult.set(false); }
  onRetry()     { this.exportFacade.reset(); }

  // ----------------------------------------------------------------
  // Stampa
  // ----------------------------------------------------------------
  readonly printableFiles    = signal<FileDTO[]>([]);
  readonly selectedPrintIds  = signal<Set<number>>(new Set());
  readonly showPrintSelector = signal(false);
  readonly selectedPrintCount = computed(() => this.selectedPrintIds().size);
  readonly hasPrintableFiles = signal(false);

  async onPrint(): Promise<void> {
    const docId = Number(this.documentId());
    if (isNaN(docId)) return;

    const files    = await this.ipcGateway.getFilesByDocumentId(docId);
    const printable = files.filter(f =>
      ['pdf', 'png', 'jpg', 'jpeg'].some(ext => f.filename.toLowerCase().endsWith(`.${ext}`))
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
    current.has(fileId) ? current.delete(fileId) : current.add(fileId);
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
  // Download
  // ----------------------------------------------------------------
  readonly downloadableFiles     = signal<FileDTO[]>([]);
  readonly selectedDownloadIds   = signal<Set<number>>(new Set());
  readonly showDownloadSelector  = signal(false);
  readonly selectedDownloadCount = computed(() => this.selectedDownloadIds().size);

  async onExport(): Promise<void> {
    const docId = Number(this.documentId());
    if (isNaN(docId)) return;

    const files = await this.ipcGateway.getFilesByDocumentId(docId);

    if (files.length === 0) return;

    if (files.length === 1) {
      this.exportFacade.exportFile(files[0].id);
      return;
    }

    this.downloadableFiles.set(files);
    this.selectedDownloadIds.set(new Set(files.map(f => f.id)));
    this.showDownloadSelector.set(true);
  }

  toggleDownloadFile(fileId: number): void {
    const current = new Set(this.selectedDownloadIds());
    current.has(fileId) ? current.delete(fileId) : current.add(fileId);
    this.selectedDownloadIds.set(current);
  }

  async confirmDownload(): Promise<void> {
    const ids = [...this.selectedDownloadIds()];
    if (ids.length === 0) return;
    this.showDownloadSelector.set(false);
    if (ids.length === 1) this.exportFacade.exportFile(ids[0]);
    else this.exportFacade.exportFiles(ids);
  }

  cancelDownload(): void {
    this.showDownloadSelector.set(false);
    this.downloadableFiles.set([]);
    this.selectedDownloadIds.set(new Set());
  }
}