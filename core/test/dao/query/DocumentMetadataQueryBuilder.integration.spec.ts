import { afterEach, beforeEach, describe, expect, it } from "vitest";
import Database from "better-sqlite3";
import { DocumentMetadataQueryBuilder } from "../../../src/dao/query/DocumentMetadataQueryBuilder";
import { SearchDocumentsQuery } from "../../../src/entity/search/SearchQuery.model";

describe("DocumentMetadataQueryBuilder Integration", () => {
  let db: Database.Database;
  const builder = new DocumentMetadataQueryBuilder();

  beforeEach(() => {
    db = new Database(":memory:");
    db.exec(`
      CREATE TABLE document (
        id INTEGER PRIMARY KEY,
        metadata TEXT NOT NULL
      );
    `);

    // Insert some test data
    const docs = [
      {
        id: 1,
        metadata: JSON.stringify({
          Doc: { Type: "Invoice", Status: "Paid" },
          Amount: 1500,
          Customer: "Corp A",
          Tags: [
            { Code: "Urgent", Ref: "X1" },
            { Code: "Normal", Ref: "Y2" },
          ],
        }),
      },
      {
        id: 2,
        metadata: JSON.stringify({
          Doc: { Type: "Receipt", Status: "Pending" },
          Amount: 50,
          Customer: "Corp B",
          Tags: [{ Code: "Ignore", Ref: "Z3" }],
        }),
      },
      {
        id: 3,
        metadata: JSON.stringify({
          Doc: { Type: "Invoice", Status: "Pending" },
          Amount: 2500,
          Customer: "Corp C",
          Tags: [
            { Code: "Urgent", Ref: "W4" },
            { Code: "Review", Ref: "X1" },
          ],
        }),
      },
      {
        id: 4,
        metadata: JSON.stringify({
          DocumentoInformatico: {
            Soggetti: {
              Ruolo: [
                {
                  Destinatario: {
                    TipoRuolo: "Destinatario",
                    PG: {
                      CodiceFiscale_PartitaIva: 31140103768,
                    },
                  },
                },
              ],
            },
          },
        }),
      },
      {
        id: 5,
        metadata: JSON.stringify({
          DocumentoInformatico: {
            Riservato: true,
          },
        }),
      },
    ];

    const stmt = db.prepare(
      "INSERT INTO document (id, metadata) VALUES (?, ?)",
    );
    for (const doc of docs) {
      stmt.run(doc.id, doc.metadata);
    }
  });

  afterEach(() => {
    db.close();
  });

  function executeQuery(filters: SearchDocumentsQuery): number[] {
    const { sql, params } = builder.build(filters);
    if (!sql) return [];

    const queryStr = `SELECT id FROM document WHERE ${sql} ORDER BY id ASC`;
    const rows = db.prepare(queryStr).all(...params) as { id: number }[];
    return rows.map((r) => r.id);
  }

  it("can match EQ on nested property", () => {
    const q = new SearchDocumentsQuery({
      logicOperator: "AND",
      items: [{ path: "Doc.Type", operator: "EQ", value: "Invoice" }],
    });
    expect(executeQuery(q)).toEqual([1, 3]);
  });

  it("can match numeric GT/LT", () => {
    const qGT = new SearchDocumentsQuery({
      logicOperator: "AND",
      items: [{ path: "Amount", operator: "GT", value: 1000 }],
    });
    expect(executeQuery(qGT)).toEqual([1, 3]);

    const qLT = new SearchDocumentsQuery({
      logicOperator: "AND",
      items: [{ path: "Amount", operator: "LT", value: 100 }],
    });
    expect(executeQuery(qLT)).toEqual([2]);
  });

  it("can match LIKE with NOCASE", () => {
    const q = new SearchDocumentsQuery({
      logicOperator: "AND",
      items: [{ path: "Customer", operator: "LIKE", value: "%corp%" }],
    });
    expect(executeQuery(q)).toEqual([1, 2, 3]);
  });

  it("can match IN arrays", () => {
    const q = new SearchDocumentsQuery({
      logicOperator: "AND",
      items: [
        { path: "Customer", operator: "IN", value: ["Corp A", "Corp B"] },
      ],
    });
    expect(executeQuery(q)).toEqual([1, 2]);
  });

  it("can compose AND conditions", () => {
    const q = new SearchDocumentsQuery({
      logicOperator: "AND",
      items: [
        { path: "Doc.Type", operator: "EQ", value: "Invoice" },
        { path: "Doc.Status", operator: "EQ", value: "Pending" },
      ],
    });
    expect(executeQuery(q)).toEqual([3]);
  });

  it("can compose OR conditions", () => {
    const q = new SearchDocumentsQuery({
      logicOperator: "OR",
      items: [
        { path: "Doc.Status", operator: "EQ", value: "Paid" },
        { path: "Amount", operator: "LT", value: 100 },
      ],
    });
    expect(executeQuery(q)).toEqual([1, 2]);
  });

  it("can evaluate ELEM_MATCH in arrays", () => {
    // Should match documents where at least one tag has Code='Urgent'
    const q1 = new SearchDocumentsQuery({
      logicOperator: "AND",
      items: [
        {
          path: "Tags",
          operator: "ELEM_MATCH",
          value: {
            logicOperator: "AND",
            items: [{ path: "Code", operator: "EQ", value: "Urgent" }],
          },
        },
      ],
    });
    expect(executeQuery(q1)).toEqual([1, 3]);

    // Should match doc 3 where there's an element matching Code=Urgent AND Ref=W4
    const q2 = new SearchDocumentsQuery({
      logicOperator: "AND",
      items: [
        {
          path: "Tags",
          operator: "ELEM_MATCH",
          value: {
            logicOperator: "AND",
            items: [
              { path: "Code", operator: "EQ", value: "Urgent" },
              { path: "Ref", operator: "EQ", value: "W4" },
            ],
          },
        },
      ],
    });
    expect(executeQuery(q2)).toEqual([3]);
  });

  it("matches ELEM_MATCH numeric JSON values when filter value is a string", () => {
    const q = new SearchDocumentsQuery({
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
    });

    expect(executeQuery(q)).toEqual([4]);
  });

  it("matches boolean filters on Riservato without parameter bind errors", () => {
    const q = new SearchDocumentsQuery({
      logicOperator: "AND",
      items: [
        {
          path: "DocumentoInformatico.Riservato",
          operator: "EQ",
          value: true,
        },
      ],
    });

    expect(executeQuery(q)).toEqual([5]);
  });
});
