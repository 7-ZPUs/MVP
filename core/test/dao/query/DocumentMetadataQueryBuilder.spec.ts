import { describe, expect, it } from "vitest";
import { DocumentMetadataQueryBuilder } from "../../../src/dao/query/DocumentMetadataQueryBuilder";
import { SearchDocumentsQuery } from "../../../src/entity/search/SearchQuery.model";

describe("DocumentMetadataQueryBuilder", () => {
  const builder = new DocumentMetadataQueryBuilder();

  it("returns empty query for empty filter group", () => {
    const query = new SearchDocumentsQuery({ logicOperator: "AND", items: [] });
    const result = builder.build(query);
    expect(result.sql).toBe("");
    expect(result.params).toEqual([]);
  });

  it("handles a single EQ condition", () => {
    const query = new SearchDocumentsQuery({
      logicOperator: "AND",
      items: [{ path: "Doc.Type", operator: "EQ", value: "Invoice" }],
    });
    const result = builder.build(query);
    expect(result.sql).toBe(
      "(json_extract(document.metadata, '$.Doc.Type') = ? COLLATE NOCASE)",
    );
    expect(result.params).toEqual(["Invoice"]);
  });

  it("handles a single GT condition", () => {
    const query = new SearchDocumentsQuery({
      logicOperator: "AND",
      items: [{ path: "Amount", operator: "GT", value: 100 }],
    });
    const result = builder.build(query);
    expect(result.sql).toBe(
      "(json_extract(document.metadata, '$.Amount') > ?)",
    );
    expect(result.params).toEqual([100]);
  });

  it("handles a single LT condition", () => {
    const query = new SearchDocumentsQuery({
      logicOperator: "OR",
      items: [{ path: "Amount", operator: "LT", value: 50 }],
    });
    const result = builder.build(query);
    expect(result.sql).toBe(
      "(json_extract(document.metadata, '$.Amount') < ?)",
    );
    expect(result.params).toEqual([50]);
  });

  it("handles a single LIKE condition", () => {
    const query = new SearchDocumentsQuery({
      logicOperator: "AND",
      items: [{ path: "Name", operator: "LIKE", value: "%test%" }],
    });
    const result = builder.build(query);
    expect(result.sql).toBe(
      "(json_extract(document.metadata, '$.Name') LIKE ? COLLATE NOCASE)",
    );
    expect(result.params).toEqual(["%test%"]);
  });

  it("handles a single IN condition", () => {
    const query = new SearchDocumentsQuery({
      logicOperator: "AND",
      items: [{ path: "Status", operator: "IN", value: ["A", "B", "C"] }],
    });
    const result = builder.build(query);
    expect(result.sql).toBe(
      "(json_extract(document.metadata, '$.Status') IN (?, ?, ?))",
    );
    expect(result.params).toEqual(["A", "B", "C"]);
  });

  it("returns empty for IN condition with empty array", () => {
    const query = new SearchDocumentsQuery({
      logicOperator: "AND",
      items: [{ path: "Status", operator: "IN", value: [] }],
    });
    const result = builder.build(query);
    expect(result.sql).toBe("");
    expect(result.params).toEqual([]);
  });

  it("handles AND group with multiple scalar conditions", () => {
    const query = new SearchDocumentsQuery({
      logicOperator: "AND",
      items: [
        { path: "Doc.Type", operator: "EQ", value: "Invoice" },
        { path: "Status", operator: "IN", value: ["Paid", "Sent"] },
      ],
    });
    const result = builder.build(query);
    expect(result.sql).toBe(
      "(json_extract(document.metadata, '$.Doc.Type') = ? COLLATE NOCASE AND json_extract(document.metadata, '$.Status') IN (?, ?))",
    );
    expect(result.params).toEqual(["Invoice", "Paid", "Sent"]);
  });

  it("handles OR group with multiple scalar conditions", () => {
    const query = new SearchDocumentsQuery({
      logicOperator: "OR",
      items: [
        { path: "Type", operator: "EQ", value: "A" },
        { path: "Type", operator: "EQ", value: "B" },
      ],
    });
    const result = builder.build(query);
    expect(result.sql).toBe(
      "(json_extract(document.metadata, '$.Type') = ? COLLATE NOCASE OR json_extract(document.metadata, '$.Type') = ? COLLATE NOCASE)",
    );
    expect(result.params).toEqual(["A", "B"]);
  });

  it("handles deeply nested groupings", () => {
    const query = new SearchDocumentsQuery({
      logicOperator: "AND",
      items: [
        { path: "Year", operator: "GT", value: 2020 },
        {
          logicOperator: "OR",
          items: [
            { path: "Dept", operator: "EQ", value: "IT" },
            { path: "Dept", operator: "EQ", value: "HR" },
          ],
        },
      ],
    });
    const result = builder.build(query);
    expect(result.sql).toBe(
      "(json_extract(document.metadata, '$.Year') > ? AND (json_extract(document.metadata, '$.Dept') = ? COLLATE NOCASE OR json_extract(document.metadata, '$.Dept') = ? COLLATE NOCASE))",
    );
    expect(result.params).toEqual([2020, "IT", "HR"]);
  });

  it("handles ELEM_MATCH group for JSON arrays", () => {
    const query = new SearchDocumentsQuery({
      logicOperator: "AND",
      items: [
        {
          path: "Items",
          operator: "ELEM_MATCH",
          value: {
            logicOperator: "AND",
            items: [
              { path: "Code", operator: "EQ", value: "XYZ" },
              { path: "Price", operator: "GT", value: 50 },
            ],
          },
        },
      ],
    });
    const result = builder.build(query);
    expect(result.sql).toBe(
      "(EXISTS (SELECT 1 FROM json_each(document.metadata, '$.Items') AS el WHERE (json_extract(el.value, '$.Code') = ? COLLATE NOCASE AND json_extract(el.value, '$.Price') > ?)))",
    );
    expect(result.params).toEqual(["XYZ", 50]);
  });

  it("throws when ELEM_MATCH value is not a valid SearchGroup", () => {
    const query = new SearchDocumentsQuery({
      logicOperator: "AND",
      items: [
        {
          path: "Items",
          operator: "ELEM_MATCH",
          value: "invalid",
        },
      ],
    });
    expect(() => builder.build(query)).toThrow(
      /ELEM_MATCH requires a nested SearchGroup value/,
    );
  });

  it("skips conditions with null or undefined value", () => {
    const query = new SearchDocumentsQuery({
      logicOperator: "AND",
      items: [
        { path: "Name", operator: "EQ", value: "Valid" },
        { path: "Age", operator: "EQ", value: null },
      ],
    });
    const result = builder.build(query);
    expect(result.sql).toBe(
      "(json_extract(document.metadata, '$.Name') = ? COLLATE NOCASE)",
    );
    expect(result.params).toEqual(["Valid"]);
  });

  it("skips conditions with whitespace-only string value", () => {
    const query = new SearchDocumentsQuery({
      logicOperator: "AND",
      items: [
        { path: "Name", operator: "EQ", value: "   " },
        { path: "Dept", operator: "EQ", value: "IT" },
      ],
    });

    const result = builder.build(query);
    expect(result.sql).toBe(
      "(json_extract(document.metadata, '$.Dept') = ? COLLATE NOCASE)",
    );
    expect(result.params).toEqual(["IT"]);
  });

  it("sanitizes IN arrays by dropping empty and whitespace-only values", () => {
    const query = new SearchDocumentsQuery({
      logicOperator: "AND",
      items: [
        {
          path: "Status",
          operator: "IN",
          value: ["", "   ", "Paid", null, "Sent"],
        },
      ],
    });

    const result = builder.build(query);
    expect(result.sql).toBe(
      "(json_extract(document.metadata, '$.Status') IN (?, ?))",
    );
    expect(result.params).toEqual(["Paid", "Sent"]);
  });

  it("skips ELEM_MATCH when nested conditions only contain whitespace-only values", () => {
    const query = new SearchDocumentsQuery({
      logicOperator: "AND",
      items: [
        {
          path: "Items",
          operator: "ELEM_MATCH",
          value: {
            logicOperator: "AND",
            items: [{ path: "Code", operator: "EQ", value: "   " }],
          },
        },
      ],
    });

    const result = builder.build(query);
    expect(result.sql).toBe("");
    expect(result.params).toEqual([]);
  });

  it("normalizes path by stripping start dollars and dots, and validates it", () => {
    const query = new SearchDocumentsQuery({
      logicOperator: "AND",
      items: [{ path: "$.My.Path", operator: "EQ", value: "X" }],
    });
    const result = builder.build(query);
    expect(result.sql).toBe(
      "(json_extract(document.metadata, '$.My.Path') = ? COLLATE NOCASE)",
    );
    expect(result.params).toEqual(["X"]);

    const badQuery1 = new SearchDocumentsQuery({
      logicOperator: "AND",
      items: [{ path: "", operator: "EQ", value: "X" }],
    });
    expect(() => builder.build(badQuery1)).toThrow(
      /SearchCondition path cannot be empty/,
    );

    const badQuery2 = new SearchDocumentsQuery({
      logicOperator: "AND",
      items: [{ path: "Path with spaces", operator: "EQ", value: "X" }],
    });
    expect(() => builder.build(badQuery2)).toThrow(
      /Invalid SearchCondition path segment/,
    );
  });
});
