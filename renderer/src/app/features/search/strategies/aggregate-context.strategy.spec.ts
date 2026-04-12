import { describe, it, expect, beforeEach } from 'vitest';
import { AggContextStrategy } from './aggregate-context.strategy';
import { SubjectRoleType, SubjectType } from '../../../../../../shared/domain/metadata/subject.enum';

describe('AggContextStrategy', () => {
  let strategy: AggContextStrategy;

  beforeEach(() => {
    strategy = new AggContextStrategy();
  });

  it('should return available roles mapped from the roleMap keys', () => {
    const roles = strategy.getAvailableRoles();
    expect(roles.length).toBeGreaterThan(0);
    
    const titolareRole = roles.find(r => r.key === SubjectRoleType.AMMINISTRAZIONE_TITOLARE);
    expect(titolareRole).toBeDefined();
    expect(titolareRole?.label).toBe(SubjectRoleType.AMMINISTRAZIONE_TITOLARE);
  });

  it('should return the correct allowed types for a valid role', () => {
    const types = strategy.getAllowedTypes(SubjectRoleType.INTESTATARIO_PG);
    expect(types).toEqual([SubjectType.PG, SubjectType.PAI, SubjectType.PAE]);
  });

  it('should return an empty array for an undefined or unknown role', () => {
    const types = strategy.getAllowedTypes('NON_EXISTENT_ROLE' as SubjectRoleType);
    expect(types).toEqual([]);
  });
});