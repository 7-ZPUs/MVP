import { IntegrityStatusEnum } from "../../../shared/domain/value-objects/IntegrityStatusEnum";

export function getIntegrityClass(status: IntegrityStatusEnum): string {
  switch (status) {
    case IntegrityStatusEnum.VALID:      return 'integrity--valid';
    case IntegrityStatusEnum.INVALID: return 'integrity--invalid';
    case IntegrityStatusEnum.UNKNOWN:   return 'integrity--unknown';
    default:        return 'integrity--unknown';
  }
}