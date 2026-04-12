import { describe, expect, it } from "vitest";

import { MetadataKeyMapper } from "../../../src/dao/mappers/MetadataKeyMapper";

describe("MetadataKeyMapper", () => {
  it("toPascalCase preserves canonical XML keys with underscores", () => {
    expect(
      MetadataKeyMapper.toPascalCase(
        "DocumentoInformatico.Soggetti.Ruolo.Destinatario.PG.CodiceFiscale_PartitaIva",
      ),
    ).toBe(
      "DocumentoInformatico.Soggetti.Ruolo.Destinatario.PG.CodiceFiscale_PartitaIva",
    );
  });

  it("toPascalCase still normalizes snake_case and kebab-case segments", () => {
    expect(MetadataKeyMapper.toPascalCase("soggetti.codice_fiscale")).toBe(
      "Soggetti.CodiceFiscale",
    );
    expect(MetadataKeyMapper.toPascalCase("soggetti.codice-fiscale")).toBe(
      "Soggetti.CodiceFiscale",
    );
  });

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

  it("mapGroup preserves CodiceFiscale_PartitaIva inside ELEM_MATCH payload", () => {
    const mapped = MetadataKeyMapper.mapGroup({
      logicOperator: "AND",
      items: [
        {
          path: "DocumentoInformatico.Soggetti.Ruolo",
          operator: "ELEM_MATCH",
          value: {
            logicOperator: "AND",
            items: [
              {
                path: "Destinatario.PG.CodiceFiscale_PartitaIva",
                operator: "EQ",
                value: "31140103768",
              },
            ],
          },
        },
      ],
    } as any);

    const nested = (mapped.items[0] as any).value;
    expect(nested.items[0].path).toBe(
      "Destinatario.PG.CodiceFiscale_PartitaIva",
    );
  });
});
