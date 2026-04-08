import { describe, it, expect, beforeEach } from 'vitest';
import { DiContextStrategy } from './di-context.strategy';
import { SubjectRoleType, SubjectType } from '../../../../../../shared/domain/metadata/subject.enum';

describe('DiContextStrategy', () => {
  let strategy: DiContextStrategy;

  beforeEach(() => {
    strategy = new DiContextStrategy();
  });

  it('should return available roles mapped from the roleMap keys', () => {
    const roles = strategy.getAvailableRoles();
    expect(roles.length).toBeGreaterThan(0);
    
    // Verify a known role exists in the returned array
    const autoreRole = roles.find(r => r.key === SubjectRoleType.AUTORE);
    expect(autoreRole).toBeDefined();
    expect(autoreRole?.label).toBe(SubjectRoleType.AUTORE);
  });

  it('should return the correct allowed types for a valid role', () => {
    const types = strategy.getAllowedTypes(SubjectRoleType.AUTORE);
    expect(types).toEqual([
      SubjectType.PF, 
      SubjectType.PG, 
      SubjectType.PAI, 
      SubjectType.PAE
    ]);
  });

  it('should return an empty array for an undefined or unknown role', () => {
    const types = strategy.getAllowedTypes('UNKNOWN_ROLE' as SubjectRoleType);
    expect(types).toEqual([]);
  });
});