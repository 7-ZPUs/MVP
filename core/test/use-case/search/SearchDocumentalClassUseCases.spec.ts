import { describe, it, expect, vi, beforeEach } from "vitest";
import { SearchDocumentalClassUC } from "../../../src/use-case/classe-documentale/impl/SearchDocumentalClassUC";
import { IDocumentClassRepository } from "../../../src/repo/IDocumentClassRepository";
import { DocumentClassMapper } from "../../../src/dao/mappers/DocumentClassMapper";

// Costruisce una DocumentClass già persistita
const makeDocumentClass = (id: number, name: string, uuid = `uuid-${id}`) => {
  const dc = DocumentClassMapper.fromPersistence({
    id,
    dipId: 1,
    dipUuid: "dip-uuid",
    uuid,
    name,
    timestamp: "2026-01-01",
    integrityStatus: "UNKNOWN",
  });
  return dc;
};

describe("SearchDocumentalClassUC", () => {
  let repo: Pick<IDocumentClassRepository, "searchDocumentalClasses">;

  beforeEach(() => {
    repo = { searchDocumentalClasses: vi.fn() };
  });

  // Caso nominale: una classe trovata per nome esatto
  it("ritorna le classi documentali trovate dal repository", async () => {
    const dc = makeDocumentClass(1, "Contratti");
    (repo.searchDocumentalClasses as ReturnType<typeof vi.fn>).mockReturnValue([
      dc,
    ]);

    const uc = new SearchDocumentalClassUC(repo as IDocumentClassRepository);
    const results = await uc.execute("Contratti");

    expect(results).toHaveLength(1);
    expect(results[0].getId()).toBe(1);
    expect(results[0].getName()).toBe("Contratti");
    expect(results[0].getUuid()).toBe("uuid-1");
  });

  // La query viene passata intatta al repository
  it("passa il nome al repository senza modificarlo", async () => {
    (repo.searchDocumentalClasses as ReturnType<typeof vi.fn>).mockReturnValue(
      [],
    );

    const uc = new SearchDocumentalClassUC(repo as IDocumentClassRepository);
    await uc.execute("Fatture 2026");

    expect(repo.searchDocumentalClasses).toHaveBeenCalledWith("Fatture 2026");
  });

  // Nessun risultato trovato
  it("ritorna array vuoto se nessuna classe corrisponde al nome", async () => {
    (repo.searchDocumentalClasses as ReturnType<typeof vi.fn>).mockReturnValue(
      [],
    );

    const uc = new SearchDocumentalClassUC(repo as IDocumentClassRepository);
    const results = await uc.execute("inesistente");

    expect(results).toHaveLength(0);
  });

  // Stringa vuota — ricerca senza filtro
  it("passa stringa vuota al repository per ricerca senza filtro", async () => {
    const dcs = [
      makeDocumentClass(1, "Contratti"),
      makeDocumentClass(2, "Fatture"),
      makeDocumentClass(3, "Verbali"),
    ];
    (repo.searchDocumentalClasses as ReturnType<typeof vi.fn>).mockReturnValue(
      dcs,
    );

    const uc = new SearchDocumentalClassUC(repo as IDocumentClassRepository);
    const results = await uc.execute("");

    expect(repo.searchDocumentalClasses).toHaveBeenCalledWith("");
    expect(results).toHaveLength(3);
  });

  // Più risultati: tutti devono essere restituiti nell'ordine del repository
  it("preserva l'ordine dei risultati restituito dal repository", async () => {
    const dcs = [
      makeDocumentClass(1, "AAA"),
      makeDocumentClass(2, "BBB"),
      makeDocumentClass(3, "CCC"),
    ];
    (repo.searchDocumentalClasses as ReturnType<typeof vi.fn>).mockReturnValue(
      dcs,
    );

    const uc = new SearchDocumentalClassUC(repo as IDocumentClassRepository);
    const results = await uc.execute("");

    expect(results.map((r) => r.getName())).toEqual(["AAA", "BBB", "CCC"]);
  });

  it("mantiene gli attributi dominio della classe documentale", async () => {
    const dc = makeDocumentClass(1, "Originale");
    (repo.searchDocumentalClasses as ReturnType<typeof vi.fn>).mockReturnValue([
      dc,
    ]);

    const uc = new SearchDocumentalClassUC(repo as IDocumentClassRepository);
    const results = await uc.execute("Originale");

    expect(results[0].getId()).toBe(1);
    expect(results[0].getName()).toBe("Originale");
    expect(results[0].getIntegrityStatus()).toBe("UNKNOWN");
  });

  it("propaga eccezioni del repository senza alterarle", async () => {
    (
      repo.searchDocumentalClasses as ReturnType<typeof vi.fn>
    ).mockImplementation(() => {
      throw new Error("document class search failed");
    });

    const uc = new SearchDocumentalClassUC(repo as IDocumentClassRepository);

    expect(() => uc.execute("Contratti")).toThrow(
      "document class search failed",
    );
  });
});
