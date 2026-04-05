import { describe, expect, it } from "vitest";

import { MetadataKeyMapper } from "../../../src/dao/mappers/MetadataKeyMapper";

describe("MetadataKeyMapper", () => {
  it("fromLegacyFilters drops null, empty and whitespace-only string values", () => {
    const group = MetadataKeyMapper.fromLegacyFilters([
      { key: "soggetto.nome", value: "Mario" },
      { key: "soggetto.cognome", value: "   " },
      { key: "soggetto.cf", value: "" },
      { key: "soggetto.piva", value: null },
    ]);

    expect(group.logicOperator).toBe("AND");
    expect(group.items).toEqual([
      {
        path: "Soggetto.Nome",
        operator: "EQ",
        value: "Mario",
      },
    ]);
  });

  it("fromLegacyFilters keeps meaningful non-string values", () => {
    const group = MetadataKeyMapper.fromLegacyFilters([
      { key: "flags.attivo", value: false },
      { key: "metrics.count", value: 0 },
    ]);

    expect(group.items).toEqual([
      {
        path: "Flags.Attivo",
        operator: "EQ",
        value: false,
      },
      {
        path: "Metrics.Count",
        operator: "EQ",
        value: 0,
      },
    ]);
  });
});
