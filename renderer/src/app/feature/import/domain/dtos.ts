import { NodeType } from './enums';
 
export interface ClasseDocumentaleDto {
  id:   string;
  nome: string;
}
 
export interface ProcessoDto {
  id:         string;
  idProcesso: string;
  classeId:   string;
}
 
export interface DocumentoDto {
  id:                   string;
  nome:                 string;
  formato:              string;
  anteprimaDisponibile: boolean;
  processoId:           string;
}
 
export interface DipTreeNodeDto {
  id:          string;
  type:        NodeType;
  label:       string;
  hasChildren: boolean;
  parentId:    string | null;
}