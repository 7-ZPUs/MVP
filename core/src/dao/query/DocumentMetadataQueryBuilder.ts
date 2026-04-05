import {
  SearchCondition,
  SearchDocumentsQuery,
  SearchGroup,
  SearchOperator,
} from "../../entity/search/SearchQuery.model";

export class DocumentMetadataQueryBuilder {
  build(filters: SearchDocumentsQuery): { sql: string; params: unknown[] } {
    if (!filters.filter || filters.filter.items.length === 0) {
      return { sql: "", params: [] };
    }

    return this.buildQueryFromGroup(filters.filter, "document.metadata");
  }

  private buildQueryFromGroup(
    group: SearchGroup,
    jsonSource: string,
  ): { sql: string; params: unknown[] } {
    const clauses: string[] = [];
    const params: unknown[] = [];

    for (const item of group.items) {
      if (this.isSearchGroup(item)) {
        const nested = this.buildQueryFromGroup(item, jsonSource);
        if (nested.sql.length > 0) {
          clauses.push(nested.sql);
          params.push(...nested.params);
        }
        continue;
      }

      const condition = this.buildCondition(item, jsonSource);
      if (condition.sql.length > 0) {
        clauses.push(condition.sql);
        params.push(...condition.params);
      }
    }

    if (clauses.length === 0) {
      return { sql: "", params: [] };
    }

    const joiner = group.logicOperator === "OR" ? " OR " : " AND ";
    return {
      sql: `(${clauses.join(joiner)})`,
      params,
    };
  }

  private buildCondition(
    condition: SearchCondition,
    jsonSource: string,
  ): { sql: string; params: unknown[] } {
    if (condition.value === null || condition.value === undefined) {
      return { sql: "", params: [] };
    }

    if (this.isBlankString(condition.value)) {
      return { sql: "", params: [] };
    }

    if (condition.operator === "ELEM_MATCH") {
      if (!this.isSearchGroup(condition.value)) {
        throw new Error("ELEM_MATCH requires a nested SearchGroup value");
      }

      const basePath = this.toJsonPath(condition.path);
      const nested = this.buildQueryFromGroup(condition.value, "el.value");
      if (nested.sql.length === 0) {
        return { sql: "", params: [] };
      }

      return {
        sql: `EXISTS (SELECT 1 FROM json_each(${jsonSource}, '${basePath}') AS el WHERE ${nested.sql})`,
        params: nested.params,
      };
    }

    const jsonPath = this.toJsonPath(condition.path);
    const jsonExtract = `json_extract(${jsonSource}, '${jsonPath}')`;
    return this.buildScalarCondition(
      jsonExtract,
      condition.operator,
      condition.value,
    );
  }

  private buildScalarCondition(
    jsonExtract: string,
    operator: Exclude<SearchOperator, "ELEM_MATCH">,
    value: unknown,
  ): { sql: string; params: unknown[] } {
    switch (operator) {
      case "EQ":
        return {
          sql: `${jsonExtract} = ? COLLATE NOCASE`,
          params: [value],
        };
      case "GT":
        return {
          sql: `${jsonExtract} > ?`,
          params: [value],
        };
      case "LT":
        return {
          sql: `${jsonExtract} < ?`,
          params: [value],
        };
      case "LIKE":
        return {
          sql: `${jsonExtract} LIKE ? COLLATE NOCASE`,
          params: [String(value)],
        };
      case "IN": {
        if (!Array.isArray(value) || value.length === 0) {
          return { sql: "", params: [] };
        }

        const sanitizedValues = value.filter(
          (item) =>
            item !== null && item !== undefined && !this.isBlankString(item),
        );

        if (sanitizedValues.length === 0) {
          return { sql: "", params: [] };
        }

        const placeholders = sanitizedValues.map(() => "?").join(", ");
        return {
          sql: `${jsonExtract} IN (${placeholders})`,
          params: sanitizedValues,
        };
      }
      default:
        return { sql: "", params: [] };
    }
  }

  private isBlankString(value: unknown): boolean {
    return typeof value === "string" && value.trim().length === 0;
  }

  private toJsonPath(path: string): string {
    const normalized = path.replace(/^\$?\.?/, "").trim();
    if (normalized.length === 0) {
      throw new Error("SearchCondition path cannot be empty");
    }

    const segments = normalized.split(".");
    for (const segment of segments) {
      if (!/^\w+$/.test(segment)) {
        throw new Error(`Invalid SearchCondition path segment: ${segment}`);
      }
    }

    return `$.${segments.join(".")}`;
  }

  private isSearchGroup(value: unknown): value is SearchGroup {
    if (typeof value !== "object" || value === null) {
      return false;
    }

    const maybeGroup = value as Partial<SearchGroup>;
    return (
      (maybeGroup.logicOperator === "AND" ||
        maybeGroup.logicOperator === "OR") &&
      Array.isArray(maybeGroup.items)
    );
  }
}
