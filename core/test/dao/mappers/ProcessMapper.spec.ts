import { describe, expect, it } from "vitest";

import {
  ProcessMapper,
  ProcessPersistenceRow,
} from "../../../src/dao/mappers/ProcessMapper";
import { MetadataPersistenceRow } from "../../../src/dao/mappers/MetadataMapper";
import { Process } from "../../../src/entity/Process";
import { IntegrityStatusEnum } from "../../../src/value-objects/IntegrityStatusEnum";
import { Metadata, MetadataType } from "../../../src/value-objects/Metadata";

describe("ProcessMapper", () => {
  const metadataRows: MetadataPersistenceRow[] = [
    {
      id: 1,
      parent_id: null,
      name: "Process",
      value: "",
      type: MetadataType.COMPOSITE,
    },
    {
      id: 2,
      parent_id: 1,
      name: "Fase",
      value: "Acquisizione",
      type: MetadataType.STRING,
    },
  ];

  it("maps persistence row to domain", () => {
    const row: ProcessPersistenceRow = {
      id: 3,
      documentClassId: 9,
      documentClassUuid: "dc-uuid",
      uuid: "proc-uuid",
      integrityStatus: "VALID",
    };

    const entity = ProcessMapper.fromPersistence(row, metadataRows);
    expect(entity.getId()).toBe(3);
    expect(entity.getDocumentClassId()).toBe(9);
    expect(entity.getDocumentClassUuid()).toBe("dc-uuid");
    expect(entity.getUuid()).toBe("proc-uuid");
    expect(entity.getIntegrityStatus()).toBe(IntegrityStatusEnum.VALID);
    expect(entity.getMetadata().getChildren()).toHaveLength(1);
  });

  it("uses UNKNOWN when status is missing or invalid", () => {
    const missingStatus: ProcessPersistenceRow = {
      id: 4,
      documentClassId: 9,
      documentClassUuid: "dc-uuid",
      uuid: "proc-uuid-2",
    };
    const invalidStatus: ProcessPersistenceRow = {
      id: 5,
      documentClassId: 9,
      documentClassUuid: "dc-uuid",
      uuid: "proc-uuid-3",
      integrityStatus: "NOT_A_STATUS",
    };

    expect(ProcessMapper.fromPersistence(missingStatus, metadataRows).getIntegrityStatus()).toBe(
      IntegrityStatusEnum.UNKNOWN,
    );
    expect(ProcessMapper.fromPersistence(invalidStatus, metadataRows).getIntegrityStatus()).toBe(
      IntegrityStatusEnum.UNKNOWN,
    );
  });

  it("maps domain to dto", () => {
    const metadata = new Metadata(
      "Process",
      [new Metadata("Fase", "Acquisizione", MetadataType.STRING)],
      MetadataType.COMPOSITE,
    );
    const entity = new Process(
      "dc-uuid",
      "proc-uuid",
      metadata,
      IntegrityStatusEnum.INVALID,
      8,
      11,
    );

    const dto = ProcessMapper.toDTO(entity);
    expect(dto.id).toBe(8);
    expect(dto.documentClassId).toBe(11);
    expect(dto.uuid).toBe("proc-uuid");
    expect(dto.integrityStatus).toBe(IntegrityStatusEnum.INVALID);
    expect(dto.metadata.name).toBe("Process");
  });

  it("uses -1 documentClassId in dto when id exists but class id is null", () => {
    const entity = new Process(
      "dc-uuid",
      "proc-uuid",
      new Metadata("root", [], MetadataType.COMPOSITE),
      IntegrityStatusEnum.UNKNOWN,
      9,
      null,
    );

    const dto = ProcessMapper.toDTO(entity);
    expect(dto.documentClassId).toBe(-1);
  });

  it("throws when converting to dto with null id", () => {
    const entity = new Process(
      "dc-uuid",
      "proc-uuid",
      new Metadata("root", [], MetadataType.COMPOSITE),
    );

    expect(() => ProcessMapper.toDTO(entity)).toThrow(
      "Cannot convert to DTO: Process entity is not yet persisted and has no ID.",
    );
  });

  it("maps domain to persistence model", () => {
    const metadata = new Metadata(
      "Process",
      [
        new Metadata("Fase", "Acquisizione", MetadataType.STRING),
        new Metadata(
          "Dettaglio",
          [new Metadata("Step", "1", MetadataType.STRING)],
          MetadataType.COMPOSITE,
        ),
      ],
      MetadataType.COMPOSITE,
    );

    const entity = new Process(
      "dc-uuid",
      "proc-uuid",
      metadata,
      IntegrityStatusEnum.VALID,
      1,
      2,
    );

    const model = ProcessMapper.toPersistence(entity);
    expect(model.documentClassUuid).toBe("dc-uuid");
    expect(model.uuid).toBe("proc-uuid");
    expect(model.integrityStatus).toBe(IntegrityStatusEnum.VALID);
    expect(model.metadata.map((m) => m.getName())).toEqual(["Fase", "Step"]);
  });
});
