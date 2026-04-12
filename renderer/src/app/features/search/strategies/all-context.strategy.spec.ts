import { describe, it, expect, beforeEach } from 'vitest';
import { AllContextStrategy } from './all-context.strategy';
import { SubjectRoleType, SubjectType } from '../../../../../../shared/domain/metadata/subject.enum';

describe('AllContextStrategy', () => {
  let strategy: AllContextStrategy;

  beforeEach(() => {
    strategy = new AllContextStrategy();
  });

  it('should return a specific list of available roles with custom labels', () => {
    const roles = strategy.getAvailableRoles();
    
    // Based on the explicit array returned in the class
    expect(roles.length).toBe(16);
    
    const autoreRole = roles.find(r => r.key === SubjectRoleType.AUTORE);
    expect(autoreRole?.label).toBe('Autore');

    const regRole = roles.find(r => r.key === SubjectRoleType.SOGGETTO_REGISTRAZIONE);
    expect(regRole?.label).toBe('Sogg. Registrazione (DI)');
  });

  it('should return the correct allowed types for a valid role', () => {
    const types = strategy.getAllowedTypes(SubjectRoleType.AMMINISTRAZIONE_PARTECIPANTE);
    expect(types).toEqual([SubjectType.PAI, SubjectType.PAE]);
  });

  it('should return an empty array for an undefined or unknown role', () => {
    const types = strategy.getAllowedTypes('FAKE_ROLE' as SubjectRoleType);
    expect(types).toEqual([]);
  });
});