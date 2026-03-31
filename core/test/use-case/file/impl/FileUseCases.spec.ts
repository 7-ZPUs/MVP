import { describe, expect, it, vi } from "vitest";

import { GetFileByIdUC } from "../../../../src/use-case/file/impl/GetFileByIdUC";
import { GetFileByDocumentUC } from "../../../../src/use-case/file/impl/GetFileByDocumentUC";
import { GetFileByStatusUC } from "../../../../src/use-case/file/impl/GetFileByStatusUC";
import { CheckFileIntegrityStatusUC } from "../../../../src/use-case/file/impl/CheckFileIntegrityStatusUC";
import { File } from "../../../../src/entity/File";
import { IFileRepository } from "../../../../src/repo/IFileRepository";
import { IntegrityStatusEnum } from "../../../../src/value-objects/IntegrityStatusEnum";
import { IIntegrityVerificationService } from "../../../../src/services/IIntegrityVerificationService";

describe("File use-cases", () => {
  // identifier: TU-S-browsing-96
  // method_name: execute()
  // description: should GetFileByIdUC delega a repo.getById
  // expected_value: matches asserted behavior: GetFileByIdUC delega a repo.getById
  it("TU-S-browsing-96: execute() should GetFileByIdUC delega a repo.getById", () => {
    const entity = new File("f", "/f", "h", false, "2", "doc-uuid");
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
    const list = [new File("f", "/f", "h", false, "8", "doc-uuid")];
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
    const list = [new File("f", "/f", "h", false, "8", "doc-uuid")];
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
  // description: should CheckFileIntegrityStatusUC delega al servizio di verifica integrità
  // expected_value: matches asserted behavior: CheckFileIntegrityStatusUC delega al servizio di verifica integrità
  it("TU-S-browsing-99: execute() should CheckFileIntegrityStatusUC imposta VALID se hash coincide", async () => {
    const integrityService: Pick<
      IIntegrityVerificationService,
      "checkFileIntegrityStatus"
    > = {
      checkFileIntegrityStatus: vi
        .fn()
        .mockResolvedValue(IntegrityStatusEnum.VALID),
    };

    const uc = new CheckFileIntegrityStatusUC(
      integrityService as IIntegrityVerificationService,
    );
    const result = await uc.execute(8);

    expect(result).toBe(IntegrityStatusEnum.VALID);
    expect(integrityService.checkFileIntegrityStatus).toHaveBeenCalledWith(8);
  });

  // identifier: TU-S-browsing-100
  // method_name: execute()
  // description: should CheckFileIntegrityStatusUC delega e propaga UNKNOWN
  // expected_value: matches asserted behavior: CheckFileIntegrityStatusUC delega e propaga UNKNOWN
  it("TU-S-browsing-100: execute() should CheckFileIntegrityStatusUC imposta UNKNOWN se hash atteso manca", async () => {
    const integrityService: Pick<
      IIntegrityVerificationService,
      "checkFileIntegrityStatus"
    > = {
      checkFileIntegrityStatus: vi
        .fn()
        .mockResolvedValue(IntegrityStatusEnum.UNKNOWN),
    };

    const uc = new CheckFileIntegrityStatusUC(
      integrityService as IIntegrityVerificationService,
    );
    const result = await uc.execute(8);

    expect(result).toBe(IntegrityStatusEnum.UNKNOWN);
    expect(integrityService.checkFileIntegrityStatus).toHaveBeenCalledWith(8);
  });

  // identifier: TU-S-browsing-101
  // method_name: execute()
  // description: should CheckFileIntegrityStatusUC propaga errore dal servizio
  // expected_value: matches asserted behavior: CheckFileIntegrityStatusUC propaga errore dal servizio
  it("TU-S-browsing-101: execute() should CheckFileIntegrityStatusUC lancia errore se file inesistente", async () => {
    const integrityService: Pick<
      IIntegrityVerificationService,
      "checkFileIntegrityStatus"
    > = {
      checkFileIntegrityStatus: vi
        .fn()
        .mockRejectedValue(new Error("File with id 99 not found")),
    };

    const uc = new CheckFileIntegrityStatusUC(
      integrityService as IIntegrityVerificationService,
    );

    await expect(uc.execute(99)).rejects.toThrow("File with id 99 not found");
  });
});
