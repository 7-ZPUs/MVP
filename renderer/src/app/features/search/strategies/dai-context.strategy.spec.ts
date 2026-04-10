import { describe, it, expect, beforeEach } from 'vitest';
import { DaiContextStrategy } from './dai-context.strategy';
import { SubjectRoleType, SubjectType } from '../../../../../../shared/domain/metadata/subject.enum';

describe('DaiContextStrategy', () => {
  let strategy: DaiContextStrategy;

  beforeEach(() => {
    strategy = new DaiContextStrategy();
  });

  it('should return available roles mapped from the roleMap keys', () => {
    const roles = strategy.getAvailableRoles();
    expect(roles.length).toBeGreaterThan(0);
    
    const regRole = roles.find(r => r.key === SubjectRoleType.AMMINISTRAZIONE_REGISTRAZIONE);
    expect(regRole).toBeDefined();
    expect(regRole?.label).toBe(SubjectRoleType.AMMINISTRAZIONE_REGISTRAZIONE);
  });

  it('should return the correct allowed types for a valid role', () => {
    const types = strategy.getAllowedTypes(SubjectRoleType.AMMINISTRAZIONE_REGISTRAZIONE);
    expect(types).toEqual([SubjectType.PAI]);
  });

  it('should return an empty array for an undefined or unknown role', () => {
    const types = strategy.getAllowedTypes('INVALID_ROLE' as SubjectRoleType);
    expect(types).toEqual([]);
  });
});