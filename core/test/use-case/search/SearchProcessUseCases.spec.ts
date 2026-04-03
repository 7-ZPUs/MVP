import { describe, it, expect, vi, beforeEach } from "vitest";
import { SearchProcessUC } from "../../../src/use-case/process/impl/SearchProcessUC";
import { IProcessRepository } from "../../../src/repo/IProcessRepository";
import { ProcessMapper } from "../../../src/dao/mappers/ProcessMapper";
import { MetadataType } from "../../../src/value-objects/Metadata";

// Costruisce un Process già persistito con uuid e metadata opzionali
const makeProcess = (
  id: number,
  uuid: string,
  metadata: { name: string; value: string }[] = [],
) => {
  const rows = [
    {
      id: 1,
      parent_id: null,
      name: "root",
      value: "",
      type: MetadataType.COMPOSITE,
    },
    ...metadata.map((m, idx) => ({
      id: idx + 2,
      parent_id: 1,
      name: m.name,
      value: m.value,
      type: MetadataType.STRING,
    })),
  ];

  return ProcessMapper.fromPersistence(
    {
      id,
      documentClassId: 1,
      documentClassUuid: "dc-uuid",
      uuid,
      integrityStatus: "UNKNOWN",
    },
    rows,
  );
};

describe("SearchProcessUC", () => {
  let repo: Pick<IProcessRepository, "searchProcesses">;

  beforeEach(() => {
    repo = { searchProcesses: vi.fn() };
  });

  // Caso nominale: un processo trovato per uuid
  it("ritorna i processi trovati dal repository", async () => {
    const proc = makeProcess(1, "proc-uuid-abc", [
      { name: "name", value: "Proc A" },
      { name: "type", value: "PROCESSO" },
    ]);
    (repo.searchProcesses as ReturnType<typeof vi.fn>).mockReturnValue([proc]);

    const uc = new SearchProcessUC(repo as IProcessRepository);
    const results = await uc.execute("proc-uuid-abc");

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      documentId: "1",
      name: "Proc A",
      type: "PROCESSO",
      score: null,
    });
  });

  // La query viene passata intatta al repository
  it("passa l'uuid al repository senza modificarlo", async () => {
    (repo.searchProcesses as ReturnType<typeof vi.fn>).mockReturnValue([]);

    const uc = new SearchProcessUC(repo as IProcessRepository);
    await uc.execute("uuid-specifico-123");

    expect(repo.searchProcesses).toHaveBeenCalledWith("uuid-specifico-123");
  });

  // Nessun risultato trovato
  it("ritorna array vuoto se nessun processo corrisponde all'uuid", async () => {
    (repo.searchProcesses as ReturnType<typeof vi.fn>).mockReturnValue([]);

    const uc = new SearchProcessUC(repo as IProcessRepository);
    const results = await uc.execute("uuid-inesistente");

    expect(results).toHaveLength(0);
  });

  // Stringa vuota — ricerca senza filtro
  it("passa stringa vuota al repository per ricerca senza filtro", async () => {
    const procs = [makeProcess(1, "uuid-1"), makeProcess(2, "uuid-2")];
    (repo.searchProcesses as ReturnType<typeof vi.fn>).mockReturnValue(procs);

    const uc = new SearchProcessUC(repo as IProcessRepository);
    const results = await uc.execute("");

    expect(repo.searchProcesses).toHaveBeenCalledWith("");
    expect(results).toHaveLength(2);
  });

  // Più risultati: ordine preservato
  it("preserva l'ordine dei risultati restituito dal repository", async () => {
    const procs = [
      makeProcess(1, "uuid-aaa"),
      makeProcess(2, "uuid-bbb"),
      makeProcess(3, "uuid-ccc"),
    ];
    (repo.searchProcesses as ReturnType<typeof vi.fn>).mockReturnValue(procs);

    const uc = new SearchProcessUC(repo as IProcessRepository);
    const results = await uc.execute("");

    expect(results.map((r) => r.documentId)).toEqual(["1", "2", "3"]);
  });

  it("usa stringa vuota per name e type se i metadati non sono presenti", async () => {
    const proc = makeProcess(1, "uuid-originale");
    (repo.searchProcesses as ReturnType<typeof vi.fn>).mockReturnValue([proc]);

    const uc = new SearchProcessUC(repo as IProcessRepository);
    const results = await uc.execute("uuid-originale");

    expect(results[0].name).toBe("");
    expect(results[0].type).toBe("");
  });

  // uuid parziale — ricerca per prefisso
  it("accetta uuid parziali per ricerche per prefisso", async () => {
    (repo.searchProcesses as ReturnType<typeof vi.fn>).mockReturnValue([]);

    const uc = new SearchProcessUC(repo as IProcessRepository);
    await uc.execute("proc-");

    expect(repo.searchProcesses).toHaveBeenCalledWith("proc-");
  });

  it("propaga eccezioni del repository senza alterarle", async () => {
    (repo.searchProcesses as ReturnType<typeof vi.fn>).mockImplementation(
      () => {
        throw new Error("process search failed");
      },
    );

    const uc = new SearchProcessUC(repo as IProcessRepository);

    await expect(uc.execute("proc-uuid")).rejects.toThrow("process search failed");
  });
});
