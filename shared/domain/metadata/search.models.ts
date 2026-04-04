import { SearchQueryType } from "./search.enum";
import { AppError } from "../error.models";
import { z } from "zod";
import { IntegrityStatusEnum } from "../../../core/src/value-objects/IntegrityStatusEnum";
import { PartialSearchFilters } from "./partial-filters-models";
import { SubjectCriteria } from "./search-subject-filters-models";
import type { ISearchResult } from "./search-result.models";

// Regex di sicurezza per il pathP
const PathRegex = /^[a-zA-Z0-9_]+(\.[a-zA-Z0-9_]+)*$/;

/**
 * Schema e DTO della singola condizione
 */
export const SearchConditionSchema = z.object({
  path: z
    .string()
    .regex(PathRegex, "Il path deve essere in una dot-notation valida"),
  operator: z.enum(["EQ", "GT", "LT", "LIKE", "IN", "ELEM_MATCH"]),
  value: z.any(),
});

export type SearchConditionDTO = z.infer<typeof SearchConditionSchema>;

export interface MetadataFilter {
  key: string;
  value: unknown;
}

/**
 * Definizione del tipo ricorsivo per TypeScript
 */
export type SearchGroupDTO = {
  logicOperator: "AND" | "OR";
  items: Array<SearchGroupDTO | SearchConditionDTO>;
};

/**
 * Schema Zod ricorsivo
 */
export const SearchGroupSchema: z.ZodType<SearchGroupDTO> = z.lazy(() =>
  z.object({
    logicOperator: z.enum(["AND", "OR"]),
    items: z
      .array(z.union([SearchConditionSchema, SearchGroupSchema]))
      .min(1, "Un gruppo deve contenere almeno un elemento"),
  }),
);

/**
 * Schema della richiesta principale.
 * Ora accetta SOLO l'albero dei filtri. Nessuna pagina/limite.
 */
export const SearchRequestSchema = z.object({
  filter: SearchGroupSchema,
});

export type SearchRequestDTO = z.infer<typeof SearchRequestSchema>;

export interface SearchFilters extends PartialSearchFilters {
  subject: SubjectCriteria[];
}

export interface SearchQuery {
  text: string;
  type: SearchQueryType;
  useSemanticSearch: boolean;
}

export interface SearchResult {
  id: number;
  uuid: string;
  integrityStatus: IntegrityStatusEnum;
}

export enum DocumentTypeEnum {
  DOCUMENTO_INFORMATICO = "DOCUMENTO INFORMATICO",
  DOCUMENTO_AMMINISTRATIVO_INFORMATICO = "DOCUMENTO AMMINISTRATIVO INFORMATICO",
  AGGREGAZIONE_DOCUMENTALE = "AGGREGAZIONE DOCUMENTALE",
}

export interface DocumentSearchResult extends SearchResult {
  name: string;
  type: DocumentTypeEnum;
  score: number | null;
}

export interface ProcessSearchResult extends SearchResult {}

export interface DocumentClassSearchResult extends SearchResult {}

// ------ FRONTEND -------

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Map<string, ValidationError[]>;
}

export interface SearchState {
  query: SearchQuery;
  filters: SearchFilters;
  results: ISearchResult[];
  loading: boolean;
  isSearching: boolean;
  error: AppError | null;
  validationErrors: Map<string, ValidationError>;
}

export type FilterValidatorFn = (
  filters: PartialSearchFilters,
) => ValidationResult;
