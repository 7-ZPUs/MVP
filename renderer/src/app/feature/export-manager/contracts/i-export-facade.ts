import { Signal }      from '@angular/core';
import { ExportPhase, OutputContext } from '../domain/enums';
import { ExportResult, ExportError } from '../domain/models';
import { DipTreeNode } from '../../import/domain/models';
 
export interface IExportFacade {
  phase:         Signal<ExportPhase>;
  outputContext: Signal<OutputContext | null>;
  result:        Signal<ExportResult | null>;
  progress:      Signal<number>;
  error:         Signal<ExportError | null>;
  loading:       Signal<boolean>;
 
  exportDocument(node: DipTreeNode):          Promise<void>;  // UC-19
  exportDocuments(nodes: DipTreeNode[]):      Promise<void>;  // UC-20
  exportReportPdf(reportId: string):          Promise<void>;  // UC-34
  printDocument(node: DipTreeNode):           Promise<void>;  // UC-22
  printDocuments(nodes: DipTreeNode[]):       Promise<void>;  // UC-23
  reset():                                    void;
}