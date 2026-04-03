import { SearchCondition, SearchGroup } from "../../entity/search/SearchQuery.model";
import { MetadataFilter } from "../../../../shared/domain/metadata";

export class MetadataKeyMapper {
  static toPascalCase(key: string): string {
    const normalized = key.replaceAll("-", "_");
    const segments = normalized.split(".");

    return segments
      .map((segment) =>
        segment
          .split(/_+/)
          .filter((part) => part.length > 0)
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(""),
      )
      .join(".");
  }

  static mapFilters(filters: MetadataFilter[]): MetadataFilter[] {
    return filters.map((filter) => ({
      key: MetadataKeyMapper.toPascalCase(filter.key),
      value: filter.value,
    }));
  }

  static mapGroup(group: SearchGroup): SearchGroup {
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
            value: MetadataKeyMapper.mapGroup(mapped.value),
          };
        }

        return mapped;
      }),
    };
  }

  static fromLegacyFilters(filters: MetadataFilter[]): SearchGroup {
    return {
      logicOperator: "AND",
      items: filters
        .filter((filter) => filter.value !== null && filter.value !== "")
        .map((filter) => ({
          path: MetadataKeyMapper.toPascalCase(filter.key),
          operator: "EQ" as const,
          value: filter.value,
        })),
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
