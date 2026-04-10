import { describe, it, expect } from 'vitest';
import { getIntegrityClass } from './integrity-status.utility';
import { IntegrityStatusEnum } from '../../../shared/domain/value-objects/IntegrityStatusEnum';

describe('getIntegrityClass', () => {
  it('should return "integrity--valid" when status is VALID', () => {
    expect(getIntegrityClass(IntegrityStatusEnum.VALID)).toBe('integrity--valid');
  });

  it('should return "integrity--invalid" when status is INVALID', () => {
    expect(getIntegrityClass(IntegrityStatusEnum.INVALID)).toBe('integrity--invalid');
  });

  it('should return "integrity--unknown" when status is UNKNOWN', () => {
    expect(getIntegrityClass(IntegrityStatusEnum.UNKNOWN)).toBe('integrity--unknown');
  });

  it('should return "integrity--unknown" for any unmapped or default status', () => {
    expect(getIntegrityClass('NON_EXISTENT_STATUS' as IntegrityStatusEnum)).toBe('integrity--unknown');
  });
});