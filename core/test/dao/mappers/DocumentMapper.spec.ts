import { describe, expect, it } from "vitest";

import {
  DocumentMapper,
  DocumentPersistenceRow,
} from "../../../src/dao/mappers/DocumentMapper";
import { MetadataPersistenceRow } from "../../../src/dao/mappers/MetadataMapper";
import { Document } from "../../../src/entity/Document";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";
import { Metadata, MetadataType } from "../../../src/value-objects/Metadata";

describe("DocumentMapper", () => {
  const metadataRows: MetadataPersistenceRow[] = [
    {
      id: 1,
      parent_id: null,
      name: "Documento",
      value: "",
      type: MetadataType.COMPOSITE,
    },
    {
      id: 2,
      parent_id: 1,
      name: "Titolo",
      value: "Doc A",
      type: MetadataType.STRING,
    },
  ];

  it("maps persistence row to domain", () => {
    const row: DocumentPersistenceRow = {
      id: 4,
      uuid: "doc-uuid",
      integrityStatus: "VALID",
      processId: 8,
      processUuid: "proc-uuid",
    };

    const entity = DocumentMapper.fromPersistence(row, metadataRows);
    expect(entity.getId()).toBe(4);
    expect(entity.getUuid()).toBe("doc-uuid");
    expect(entity.getProcessId()).toBe(8);
    expect(entity.getProcessUuid()).toBe("proc-uuid");
    expect(entity.getIntegrityStatus()).toBe(IntegrityStatusEnum.VALID);
    expect(entity.getMetadata().getName()).toBe("Documento");
    expect(entity.getMetadata().getChildren()).toHaveLength(1);
  });

  it("uses UNKNOWN when status is missing or invalid", () => {
    const missingStatus: DocumentPersistenceRow = {
      id: 5,
      uuid: "doc-uuid-2",
      processId: 9,
      processUuid: "proc-uuid",
    };
    const invalidStatus: DocumentPersistenceRow = {
      id: 6,
      uuid: "doc-uuid-3",
      integrityStatus: "NOT_A_STATUS",
      processId: 9,
      processUuid: "proc-uuid",
    };

    expect(
      DocumentMapper.fromPersistence(
        missingStatus,
        metadataRows,
      ).getIntegrityStatus(),
    ).toBe(IntegrityStatusEnum.UNKNOWN);
    expect(
      DocumentMapper.fromPersistence(
        invalidStatus,
        metadataRows,
      ).getIntegrityStatus(),
    ).toBe(IntegrityStatusEnum.UNKNOWN);
  });

  it("maps domain to dto", () => {
    const metadata = new Metadata(
      "Documento",
      [new Metadata("Titolo", "Doc A", MetadataType.STRING)],
      MetadataType.COMPOSITE,
    );
    const entity = new Document(
      "doc-uuid",
      metadata,
      "proc-uuid",
      IntegrityStatusEnum.INVALID,
      10,
      20,
    );

    const dto = DocumentMapper.toDTO(entity);
    expect(dto.id).toBe(10);
    expect(dto.processId).toBe(20);
    expect(dto.uuid).toBe("doc-uuid");
    expect(dto.integrityStatus).toBe(IntegrityStatusEnum.INVALID);
    expect(dto.metadata.name).toBe("Documento");
  });

  it("throws when converting to dto with null id", () => {
    const entity = new Document(
      "doc-uuid",
      new Metadata("root", [], MetadataType.COMPOSITE),
      "proc-uuid",
    );

    expect(() => DocumentMapper.toDTO(entity)).toThrow(
      "Cannot convert to DTO: Document entity is not yet persisted and has no ID.",
    );
  });

  it("uses -1 processId in dto when processId is null", () => {
    const entity = new Document(
      "doc-uuid",
      new Metadata("root", [], MetadataType.COMPOSITE),
      "proc-uuid",
      IntegrityStatusEnum.UNKNOWN,
      15,
      null,
    );

    const dto = DocumentMapper.toDTO(entity);
    expect(dto.processId).toBe(-1);
  });

  it("maps domain to persistence model", () => {
    const metadata = new Metadata(
      "Documento",
      [
        new Metadata("Titolo", "Doc A", MetadataType.STRING),
        new Metadata(
          "Soggetto",
          [new Metadata("Nome", "Mario", MetadataType.STRING)],
          MetadataType.COMPOSITE,
        ),
      ],
      MetadataType.COMPOSITE,
    );

    const entity = new Document(
      "doc-uuid",
      metadata,
      "proc-uuid",
      IntegrityStatusEnum.VALID,
      1,
      2,
    );

    const model = DocumentMapper.toPersistence(entity);
    expect(model.uuid).toBe("doc-uuid");
    expect(model.integrityStatus).toBe(IntegrityStatusEnum.VALID);
    expect(model.processUuid).toBe("proc-uuid");
    expect(model.metadata.map((m) => m.getName())).toEqual(["Titolo", "Nome"]);
  });

  it("metadataToJson preserves repeated sibling nodes as arrays", () => {
    const metadata = new Metadata(
      "DocumentoInformatico",
      [
        new Metadata(
          "Soggetti",
          [
            new Metadata(
              "Ruolo",
              [
                new Metadata(
                  "Altro",
                  [
                    new Metadata("TipoRuolo", "Altro", MetadataType.STRING),
                    new Metadata(
                      "PF",
                      [
                        new Metadata("Cognome", "Rossi", MetadataType.STRING),
                        new Metadata("Nome", "Paolo", MetadataType.STRING),
                      ],
                      MetadataType.COMPOSITE,
                    ),
                  ],
                  MetadataType.COMPOSITE,
                ),
              ],
              MetadataType.COMPOSITE,
            ),
            new Metadata(
              "Ruolo",
              [
                new Metadata(
                  "ResponsabileGestioneDocumentale",
                  [
                    new Metadata(
                      "TipoRuolo",
                      "Responsabile della Gestione Documentale",
                      MetadataType.STRING,
                    ),
                    new Metadata(
                      "PF",
                      [new Metadata("Cognome", "Colombo", MetadataType.STRING)],
                      MetadataType.COMPOSITE,
                    ),
                  ],
                  MetadataType.COMPOSITE,
                ),
              ],
              MetadataType.COMPOSITE,
            ),
          ],
          MetadataType.COMPOSITE,
        ),
      ],
      MetadataType.COMPOSITE,
    );

    const json = DocumentMapper.metadataToJson(metadata);
    const ruolo = (json as any).DocumentoInformatico.Soggetti.Ruolo;

    expect(Array.isArray(ruolo)).toBe(true);
    expect(ruolo).toHaveLength(2);
    expect(ruolo[0].Altro.PF.Cognome).toBe("Rossi");
    expect(ruolo[0].Altro.PF.Nome).toBe("Paolo");
    expect(ruolo[1].ResponsabileGestioneDocumentale.PF.Cognome).toBe("Colombo");
  });

  it("metadataJsonToRoot restores repeated nodes from arrays", () => {
    const metadataJson = JSON.stringify({
      DocumentoInformatico: {
        Soggetti: {
          Ruolo: [
            {
              Altro: {
                TipoRuolo: "Altro",
                PF: {
                  Cognome: "Rossi",
                  Nome: "Paolo",
                },
              },
            },
            {
              ResponsabileGestioneDocumentale: {
                TipoRuolo: "Responsabile della Gestione Documentale",
                PF: {
                  Cognome: "Colombo",
                  Nome: "Marco",
                },
              },
            },
          ],
        },
      },
    });

    const root = DocumentMapper.metadataJsonToRoot(metadataJson);
    const soggetti = root.findNodeByName("Soggetti");

    expect(soggetti).not.toBeNull();
    const ruoloNodes =
      soggetti?.getChildren().filter((child) => child.getName() === "Ruolo") ?? [];
    expect(ruoloNodes).toHaveLength(2);
    expect(root.findNodeByName("Altro")?.findNodeByName("Cognome")?.getStringValue()).toBe(
      "Rossi",
    );
    expect(
      root
        .findNodeByName("ResponsabileGestioneDocumentale")
        ?.findNodeByName("Cognome")
        ?.getStringValue(),
    ).toBe("Colombo");
  });
});
