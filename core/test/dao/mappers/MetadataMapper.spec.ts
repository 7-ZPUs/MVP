import { describe, expect, it } from "vitest";

import {
  MetadataPersistenceRow,
  MetadataMapper,
} from "../../../src/dao/mappers/MetadataMapper";
import { MetadataType } from "../../../src/value-objects/Metadata";

describe("MetadataMapper.fromFlatRows", () => {
  it("throws when rows are empty", () => {
    expect(() => MetadataMapper.fromFlatRows([])).toThrow(
      "Cannot build metadata tree from empty rows",
    );
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

  it("throws when duplicate row ids are present", () => {
    const rows: MetadataPersistenceRow[] = [
      {
        id: 1,
        parent_id: null,
        name: "A",
        value: "",
        type: MetadataType.COMPOSITE,
      },
      {
        id: 1,
        parent_id: null,
        name: "B",
        value: "x",
        type: MetadataType.STRING,
      },
    ];

    expect(() => MetadataMapper.fromFlatRows(rows)).toThrow(
      "Invalid metadata tree: duplicate row id 1",
    );
  });

  it("throws when no root nodes are found", () => {
    const rows: MetadataPersistenceRow[] = [
      {
        id: 1,
        parent_id: 2,
        name: "A",
        value: "",
        type: MetadataType.COMPOSITE,
      },
      {
        id: 2,
        parent_id: 1,
        name: "B",
        value: "",
        type: MetadataType.COMPOSITE,
      },
    ];

    expect(() => MetadataMapper.fromFlatRows(rows)).toThrow(
      "Invalid metadata tree: no root nodes found",
    );
  });

  it("throws when metadata type is invalid", () => {
    const rows: MetadataPersistenceRow[] = [
      {
        id: 5,
        parent_id: null,
        name: "TipoNonValido",
        value: "",
        type: "invalid",
      },
    ];

    expect(() => MetadataMapper.fromFlatRows(rows)).toThrow(
      "Invalid metadata type: invalid",
    );
  });
});

describe("MetadataMapper.flatten", () => {
  it("returns the same node for string metadata", () => {
    const leaf = MetadataMapper.fromFlatRows([
      {
        id: 1,
        parent_id: null,
        name: "Titolo",
        value: "Doc A",
        type: MetadataType.STRING,
      },
    ]);

    const flat = MetadataMapper.flatten(leaf);
    expect(flat).toHaveLength(1);
    expect(flat[0].getName()).toBe("Titolo");
    expect(flat[0].getStringValue()).toBe("Doc A");
  });

  it("returns leaf descendants for composite metadata", () => {
    const root = MetadataMapper.fromFlatRows([
      {
        id: 1,
        parent_id: null,
        name: "Root",
        value: "",
        type: MetadataType.COMPOSITE,
      },
      {
        id: 2,
        parent_id: 1,
        name: "A",
        value: "a",
        type: MetadataType.STRING,
      },
      {
        id: 3,
        parent_id: 1,
        name: "B",
        value: "",
        type: MetadataType.COMPOSITE,
      },
      {
        id: 4,
        parent_id: 3,
        name: "C",
        value: "c",
        type: MetadataType.STRING,
      },
    ]);

    const flat = MetadataMapper.flatten(root);
    expect(flat).toHaveLength(2);
    expect(flat.map((node) => node.getName())).toEqual(["A", "C"]);
  });
});
