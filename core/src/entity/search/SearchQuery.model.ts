// src/domain/models/search-query.model.ts

export type LogicOperator = 'AND' | 'OR';

export type SearchOperator = 
  | 'EQ' 
  | 'GT' 
  | 'LT' 
  | 'LIKE' 
  | 'IN' 
  | 'ELEM_MATCH';

/**
 * Rappresenta una singola condizione (la Foglia)
 */
export interface SearchCondition {
  readonly path: string;
  readonly operator: SearchOperator;
  readonly value: any;
}

/**
 * Rappresenta un gruppo logico (il Nodo)
 */
export interface SearchGroup {
  readonly logicOperator: LogicOperator;
  readonly items: ReadonlyArray<SearchCondition | SearchGroup>;
}

/**
 * L'oggetto Query che verrà passato allo Use Case e poi al DAO.
 * (Paginazione rimossa: gestita interamente dal frontend)
 */
export class SearchDocumentsQuery {
  constructor(
    public readonly filter: SearchGroup
  ) {}

  // Metodo di utilità per evitare che query troppo profonde blocchino il DB
  public isTooDeep(maxDepth: number = 5): boolean {
    return this.calculateDepth(this.filter) > maxDepth;
  }

  private calculateDepth(group: SearchGroup, currentDepth: number = 1): number {
    let max = currentDepth;
    for (const item of group.items) {
      if ('logicOperator' in item) {
        const depth = this.calculateDepth(item, currentDepth + 1);
        if (depth > max) max = depth;
      }
    }
    return max;
  }
}