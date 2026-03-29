import fs from "node:fs";
import { describe, expect, it, vi } from "vitest";

import { GetFileByIdUC } from "../../../../src/use-case/file/impl/GetFileByIdUC";
import { GetFileByDocumentUC } from "../../../../src/use-case/file/impl/GetFileByDocumentUC";
import { GetFileByStatusUC } from "../../../../src/use-case/file/impl/GetFileByStatusUC";
import { CheckFileIntegrityStatusUC } from "../../../../src/use-case/file/impl/CheckFileIntegrityStatusUC";
import { File } from "../../../../src/entity/File";
import { IFileRepository } from "../../../../src/repo/IFileRepository";
import { IntegrityStatusEnum } from "../../../../src/value-objects/IntegrityStatusEnum";
import { IHashingService } from "../../../../src/services/IHashingService";

describe("File use-cases", () => {
  // identifier: TU-S-browsing-96
  // method_name: execute()
  // description: should GetFileByIdUC delega a repo.getById
  // expected_value: matches asserted behavior: GetFileByIdUC delega a repo.getById
  it("TU-S-browsing-96: execute() should GetFileByIdUC delega a repo.getById", () => {
    const entity = new File("f", "/f", "h", false, "2");
    const repo: Pick<IFileRepository, "getById"> = {
      getById: vi.fn().mockReturnValue(entity),
    };

    const uc = new GetFileByIdUC(repo as IFileRepository);
    const result = uc.execute(11);

    expect(repo.getById).toHaveBeenCalledWith(11);
    expect(result).toBe(entity);
  });

  // identifier: TU-S-browsing-97
  // method_name: execute()
  // description: should GetFileByDocumentUC delega a repo.getByDocumentId
  // expected_value: matches asserted behavior: GetFileByDocumentUC delega a repo.getByDocumentId
  it("TU-S-browsing-97: execute() should GetFileByDocumentUC delega a repo.getByDocumentId", () => {
    const list = [new File("f", "/f", "h", false, "8")];
    const repo: Pick<IFileRepository, "getByDocumentId"> = {
      getByDocumentId: vi.fn().mockReturnValue(list),
    };

    const uc = new GetFileByDocumentUC(repo as IFileRepository);
    const result = uc.execute(8);

    expect(repo.getByDocumentId).toHaveBeenCalledWith(8);
    expect(result).toBe(list);
  });

  // identifier: TU-S-browsing-98
  // method_name: execute()
  // description: should GetFileByStatusUC delega a repo.getByStatus
  // expected_value: matches asserted behavior: GetFileByStatusUC delega a repo.getByStatus
  it("TU-S-browsing-98: execute() should GetFileByStatusUC delega a repo.getByStatus", () => {
    const list = [new File("f", "/f", "h", false, "8")];
    const repo: Pick<IFileRepository, "getByStatus"> = {
      getByStatus: vi.fn().mockReturnValue(list),
    };

    const uc = new GetFileByStatusUC(repo as IFileRepository);
    const result = uc.execute(IntegrityStatusEnum.UNKNOWN);

    expect(repo.getByStatus).toHaveBeenCalledWith(IntegrityStatusEnum.UNKNOWN);
    expect(result).toBe(list);
  });

  // identifier: TU-S-browsing-99
  // method_name: execute()
  // description: should CheckFileIntegrityStatusUC imposta VALID se hash coincide
  // expected_value: matches asserted behavior: CheckFileIntegrityStatusUC imposta VALID se hash coincide
  it("TU-S-browsing-99: execute() should CheckFileIntegrityStatusUC imposta VALID se hash coincide", async () => {
    const entity = new File("f", "/f", "expected", false, "8");
    const repo: Pick<IFileRepository, "getById" | "updateIntegrityStatus"> = {
      getById: vi.fn().mockReturnValue(entity),
      updateIntegrityStatus: vi.fn(),
    };
    const hashingService: Pick<IHashingService, "calcolaHash"> = {
      calcolaHash: vi.fn().mockResolvedValue("expected"),
    };

    vi.spyOn(fs, "readFileSync").mockReturnValue(Buffer.from("abc"));

    const uc = new CheckFileIntegrityStatusUC(
      repo as IFileRepository,
      hashingService as IHashingService,
    );
    const result = await uc.execute(8);

    expect(result).toBe(IntegrityStatusEnum.VALID);
    expect(repo.updateIntegrityStatus).toHaveBeenCalledWith(
      8,
      IntegrityStatusEnum.VALID,
    );
  });

  // identifier: TU-S-browsing-100
  // method_name: execute()
  // description: should CheckFileIntegrityStatusUC imposta UNKNOWN se hash atteso manca
  // expected_value: matches asserted behavior: CheckFileIntegrityStatusUC imposta UNKNOWN se hash atteso manca
  it("TU-S-browsing-100: execute() should CheckFileIntegrityStatusUC imposta UNKNOWN se hash atteso manca", async () => {
    const entity = new File("f", "/f", "", false, "8");
    const repo: Pick<IFileRepository, "getById" | "updateIntegrityStatus"> = {
      getById: vi.fn().mockReturnValue(entity),
      updateIntegrityStatus: vi.fn(),
    };
    const hashingService: Pick<IHashingService, "calcolaHash"> = {
      calcolaHash: vi.fn(),
    };

    const uc = new CheckFileIntegrityStatusUC(
      repo as IFileRepository,
      hashingService as IHashingService,
    );
    const result = await uc.execute(8);

    expect(result).toBe(IntegrityStatusEnum.UNKNOWN);
    expect(repo.updateIntegrityStatus).toHaveBeenCalledWith(
      8,
      IntegrityStatusEnum.UNKNOWN,
    );
    expect(hashingService.calcolaHash).not.toHaveBeenCalled();
  });

  // identifier: TU-S-browsing-101
  // method_name: execute()
  // description: should CheckFileIntegrityStatusUC lancia errore se file inesistente
  // expected_value: matches asserted behavior: CheckFileIntegrityStatusUC lancia errore se file inesistente
  it("TU-S-browsing-101: execute() should CheckFileIntegrityStatusUC lancia errore se file inesistente", async () => {
    const repo: Pick<IFileRepository, "getById" | "updateIntegrityStatus"> = {
      getById: vi.fn().mockReturnValue(null),
      updateIntegrityStatus: vi.fn(),
    };
    const hashingService: Pick<IHashingService, "calcolaHash"> = {
      calcolaHash: vi.fn(),
    };

    const uc = new CheckFileIntegrityStatusUC(
      repo as IFileRepository,
      hashingService as IHashingService,
    );

    await expect(uc.execute(99)).rejects.toThrow("File with id 99 not found");
  });
});
