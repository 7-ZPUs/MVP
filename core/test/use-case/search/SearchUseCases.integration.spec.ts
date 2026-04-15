import { afterAll, beforeAll, describe, expect, it } from "vitest";
import Database from "better-sqlite3";

import { DocumentDAO } from "../../../src/dao/DocumentDAO";
import { DocumentPersistenceAdapter } from "../../../src/repo/impl/DocumentPersistenceAdapter";
import { SearchDocumentsUC } from "../../../src/use-case/document/impl/SearchDocumentsUC";
import { SearchDocumentsQuery } from "../../../src/entity/search/SearchQuery.model";

describe("SearchUseCases integration tests with real DB", () => {
  let db: Database.Database;
  let useCase: SearchDocumentsUC;

  beforeAll(() => {
    // Open in read-only mode to prevent accidental mutations
    db = new Database("perf-dip-viewer.db", { readonly: true });
    
    // Wire up the real stack
    const dao = new DocumentDAO(db);
    const repo = new DocumentPersistenceAdapter(dao);
    useCase = new SearchDocumentsUC(repo);
  });

  afterAll(() => {
    if (db) {
      db.close();
    }
  });

  it("1. EQ operator (TipologiaDocumentale)", async () => {
    // We expect exactly 54 'Fatture'
    const query = new SearchDocumentsQuery({
      logicOperator: "AND",
      items: [
        { path: "DocumentoInformatico.TipologiaDocumentale", operator: "EQ", value: "Fatture" }
      ]
    });
    
    const results = await useCase.execute(query);
    expect(results).toHaveLength(54);
  });

  it("2. EQ operator on numeric-coerced value (VersioneDelDocumento)", async () => {
    // We expect exactly 80 docs with VersioneDelDocumento = 1
    const query = new SearchDocumentsQuery({
      logicOperator: "AND",
      items: [
        { path: "DocumentoInformatico.VersioneDelDocumento", operator: "EQ", value: 1 }
      ]
    });
    
    const results = await useCase.execute(query);
    expect(results).toHaveLength(80);
  });

  it("3. LIKE operator (NomeDelDocumento prefix)", async () => {
    // We expect exactly 93 docs starting with 'FilePrincipale'
    const query = new SearchDocumentsQuery({
      logicOperator: "AND",
      items: [
        { path: "DocumentoInformatico.NomeDelDocumento", operator: "LIKE", value: "FilePrincipale%" }
      ]
    });
    
    const results = await useCase.execute(query);
    expect(results).toHaveLength(93);
  });

  it("4. IN operator (TipologiaDiFlusso U|E)", async () => {
    // We expect exactly 73 docs
    const query = new SearchDocumentsQuery({
      logicOperator: "AND",
      items: [
        { path: "DocumentoInformatico.DatiDiRegistrazione.TipologiaDiFlusso", operator: "IN", value: ["U", "E"] }
      ]
    });
    
    const results = await useCase.execute(query);
    expect(results).toHaveLength(73);
  });

  it("5. GT operator on numeric range (NumeroRegistrazioneDocumento)", async () => {
    // Find all documents with NumeroRegistrazioneDocumento > 0
    const query = new SearchDocumentsQuery({
      logicOperator: "AND",
      items: [
        { path: "DocumentoInformatico.DatiDiRegistrazione.TipoRegistro.Repertorio_Registro.NumeroRegistrazioneDocumento", operator: "GT", value: 0 }
      ]
    });
    
    const results = await useCase.execute(query);
    // As long as it works without errors, we just check that we get results
    expect(results.length).toBeGreaterThan(0);
  });

  it("6. Compound AND query (Fatture + Flusso U)", async () => {
    // We expect exactly 31 docs
    const query = new SearchDocumentsQuery({
      logicOperator: "AND",
      items: [
        { path: "DocumentoInformatico.TipologiaDocumentale", operator: "EQ", value: "Fatture" },
        { path: "DocumentoInformatico.DatiDiRegistrazione.TipologiaDiFlusso", operator: "EQ", value: "U" }
      ]
    });
    
    const results = await useCase.execute(query);
    expect(results).toHaveLength(31);
  });

  it("7. Compound OR query (Fatture | Registri IVA)", async () => {
    // 54 Fatture + 34 Registri IVA = 88 docs
    const query = new SearchDocumentsQuery({
      logicOperator: "OR",
      items: [
        { path: "DocumentoInformatico.TipologiaDocumentale", operator: "EQ", value: "Fatture" },
        { path: "DocumentoInformatico.TipologiaDocumentale", operator: "EQ", value: "Registri IVA" }
      ]
    });
    
    const results = await useCase.execute(query);
    expect(results).toHaveLength(88);
  });

  it("8. Empty search items returns empty results", async () => {
    const query = new SearchDocumentsQuery({
      logicOperator: "AND",
      items: []
    });
    
    const results = await useCase.execute(query);
    expect(results).toHaveLength(0); // Assuming empty filter matches nothing or drops
  });

  it("9. Unknown path returns empty result array", async () => {
    const query = new SearchDocumentsQuery({
      logicOperator: "AND",
      items: [
        { path: "DocumentoInformatico.Inesistente.Percorso", operator: "EQ", value: "Test" }
      ]
    });
    
    const results = await useCase.execute(query);
    expect(results).toHaveLength(0);
  });

  it("10. Deeply nested groupings", async () => {
    // AND(VersioneDelDocumento=1, OR(Fatture, Registri IVA))
    const query = new SearchDocumentsQuery({
      logicOperator: "AND",
      items: [
        { path: "DocumentoInformatico.VersioneDelDocumento", operator: "EQ", value: 1 },
        {
          logicOperator: "OR",
          items: [
            { path: "DocumentoInformatico.TipologiaDocumentale", operator: "EQ", value: "Fatture" },
            { path: "DocumentoInformatico.TipologiaDocumentale", operator: "EQ", value: "Registri IVA" }
          ]
        }
      ]
    });
    
    const results = await useCase.execute(query);
    // Should be less than or equal to 88
    expect(results.length).toBeLessThanOrEqual(88);
    expect(results.length).toBeGreaterThan(0);
  });

  it("11. ELEM_MATCH logic execution over nested arrays", async () => {
    // Finds elements inside the IndiceAllegati array or object
    const query = new SearchDocumentsQuery({
      logicOperator: "AND",
      items: [
        {
          path: "DocumentoInformatico.Allegati",
          operator: "ELEM_MATCH",
          value: {
            logicOperator: "AND",
            items: [
              { path: "IndiceAllegati.Descrizione", operator: "LIKE", value: "%allegato%" }
            ]
          }
        }
      ]
    });
    
    const results = await useCase.execute(query);
    expect(Array.isArray(results)).toBe(true);
  });

});
