import { InjectionToken, Signal } from '@angular/core';

export enum OutputAction {
  SAVE = 'SAVE',
  SAVE_MULTIPLE = 'SAVE_MULTIPLE',
  PRINT = 'PRINT',
  PRINT_MULTIPLE = 'PRINT_MULTIPLE',
  DOWNLOAD = 'DOWNLOAD',
  EXPORT_PDF = 'EXPORT_PDF',
}

export interface OutputContext {
  tipo: string; // 'DOCUMENT' | 'AGGREGATE'
  documentId?: string;
  documentName?: string;
  mimeType?: string;
}

export interface IOutputFacade {
  isWorking: Signal<boolean>;
  save(context: OutputContext): Promise<void>;
  print(context: OutputContext): Promise<void>;
  exportPdf(context: OutputContext): Promise<void>;
  download(context: OutputContext): Promise<void>;
}

export const OUTPUT_FACADE_TOKEN = new InjectionToken<IOutputFacade>('IOutputFacade');
