import { ElementType } from "./search.enum";
import { IntegrityStatusEnum } from "../../../core/src/value-objects/IntegrityStatusEnum";

export interface IBaseSearchResult {
  id: string;
  uuid: string;
  name: string;
  type: ElementType;
  integrityStatus: IntegrityStatusEnum;
}

export interface IDocumentSearchResult extends IBaseSearchResult {
  type:
    | ElementType.DOCUMENTO_INFORMATICO
    | ElementType.DOCUMENTO_AMMINISTRATIVO_INFORMATICO;
  score: number | null;
}

export interface IAggregateSearchResult extends IBaseSearchResult {
  type: ElementType.AGGREGAZIONE_DOCUMENTALE;
  score: number | null;
}

export interface IProcessSearchResult extends IBaseSearchResult {
  type: ElementType.PROCESS;
}

export interface IClassSearchResult extends IBaseSearchResult {
  type: ElementType.CLASS;
}

export type ISearchResult =
  | IDocumentSearchResult
  | IProcessSearchResult
  | IAggregateSearchResult
  | IClassSearchResult;
