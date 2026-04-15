import {
  SearchCondition,
  SearchGroup,
} from "../../entity/search/SearchQuery.model";
import { MetadataFilter } from "../../../../shared/domain/metadata";
import { SearchGroupDTO } from "../../../../shared/domain/metadata/search.models";

export class MetadataKeyMapper {
  static toPascalCase(key: string): string {
    const normalized = key.replaceAll("-", "_");
    const segments = normalized.split(".");

    return segments
      .map((segment) => MetadataKeyMapper.normalizeSegment(segment))
      .join(".");
  }

  private static normalizeSegment(segment: string): string {
    const parts = segment.split(/_+/).filter((part) => part.length > 0);
    if (parts.length === 0) {
      return "";
    }

    const hasUnderscore = segment.includes("_");
    const hasUppercase = /[A-Z]/.test(segment.replaceAll("_", ""));
    const separator = hasUnderscore && hasUppercase ? "_" : "";

    return parts
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(separator);
  }

  static fromLegacyFilters(filters: MetadataFilter[]): SearchGroup {
    const items: SearchCondition[] = filters
      .filter(({ value }) => {
        if (value === null || value === undefined) {
          return false;
        }
        if (typeof value === "string") {
          return value.trim().length > 0;
        }
        return true;
      })
      .map(({ key, value }) => ({
        path: MetadataKeyMapper.toPascalCase(key),
        operator: "EQ" as const,
        value,
      }));

    return {
      logicOperator: "AND",
      items,
    };
  }

  static mapGroup(group: SearchGroupDTO): SearchGroup {
    return {
      logicOperator: group.logicOperator,
      items: group.items.map((item) => {
        if (MetadataKeyMapper.isGroup(item)) {
          return MetadataKeyMapper.mapGroup(item);
        }

        const mapped: SearchCondition = {
          ...item,
          path: MetadataKeyMapper.toPascalCase(item.path),
        };

        if (
          mapped.operator === "ELEM_MATCH" &&
          MetadataKeyMapper.isGroup(mapped.value)
        ) {
          return {
            ...mapped,
            value: MetadataKeyMapper.mapGroup(item.value),
          };
        }

        return mapped;
      }),
    };
  }

  private static isGroup(value: unknown): value is SearchGroup {
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
