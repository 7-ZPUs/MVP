import { describe, expect, it } from "vitest";

import {
  MetadataPersistenceRow,
  MetadataMapper,
} from "../../../src/dao/mappers/MetadataMapper";
import { MetadataType } from "../../../src/value-objects/Metadata";

describe("MetadataMapper.fromFlatRows", () => {
  it("returns null when rows are empty", () => {
    expect(MetadataMapper.fromFlatRows([])).toBeNull();
  });

  it("builds a synthetic root when multiple top-level rows exist", () => {
    const rows: MetadataPersistenceRow[] = [
      {
        id: 1,
        parent_id: null,
        name: "Title",
        value: "Documento A",
        type: MetadataType.STRING,
      },
      {
        id: 2,
        parent_id: null,
        name: "Soggetto",
        value: "",
        type: MetadataType.COMPOSITE,
      },
      {
        id: 3,
        parent_id: 2,
        name: "Nome",
        value: "Mario",
        type: MetadataType.STRING,
      },
    ];

    const root = MetadataMapper.fromFlatRows(rows);
    expect(root).not.toBeNull();
    expect(root?.getName()).toBe("root");
    expect(root?.getType()).toBe(MetadataType.COMPOSITE);
    expect(root?.getChildren()).toHaveLength(2);

    const subject = root?.getChildren()[1];
    expect(subject?.getName()).toBe("Soggetto");
    expect(subject?.getType()).toBe(MetadataType.COMPOSITE);
    expect(subject?.getChildren()).toHaveLength(1);
    expect(subject?.getChildren()[0].getName()).toBe("Nome");
    expect(subject?.getChildren()[0].getStringValue()).toBe("Mario");
  });

  it("normalizes lowercase metadata types", () => {
    const rows: MetadataPersistenceRow[] = [
      {
        id: 10,
        parent_id: null,
        name: "Nodo",
        value: "",
        type: "composite",
      },
      {
        id: 11,
        parent_id: 10,
        name: "Valore",
        value: "1",
        type: "number",
      },
    ];

    const root = MetadataMapper.fromFlatRows(rows);
    expect(root?.getType()).toBe(MetadataType.COMPOSITE);
    expect(root?.getChildren()).toHaveLength(1);
    expect(root?.getChildren()[0].getType()).toBe(MetadataType.NUMBER);
  });

  it("throws when a parent row is missing", () => {
    const rows: MetadataPersistenceRow[] = [
      {
        id: 100,
        parent_id: 999,
        name: "Orphan",
        value: "x",
        type: MetadataType.STRING,
      },
    ];

    expect(() => MetadataMapper.fromFlatRows(rows)).toThrow(
      "Invalid metadata tree: missing parent row for id 100 (parent_id=999)",
    );
  });
});
