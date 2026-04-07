import { IDocContextStrategy, RoleDefinition } from '../contracts/doc-context-strategy.interface';
import {
  SubjectRoleType,
  SubjectType,
} from '../../../../../../shared/domain/metadata/subject.enum';

export class AggContextStrategy implements IDocContextStrategy {
  private readonly roleMap: Partial<Record<SubjectRoleType, SubjectType[]>> = {
    [SubjectRoleType.AMMINISTRAZIONE_TITOLARE]: [SubjectType.PAI],
    [SubjectRoleType.AMMINISTRAZIONE_PARTECIPANTE]: [SubjectType.PAI, SubjectType.PAE],
    [SubjectRoleType.ASSEGNATARIO]: [SubjectType.AS],
    [SubjectRoleType.INTESTATARIO_PF]: [SubjectType.PF],
    [SubjectRoleType.INTESTATARIO_PG]: [SubjectType.PG, SubjectType.PAI, SubjectType.PAE],
    [SubjectRoleType.RUP]: [SubjectType.RUP],
  };

  getAvailableRoles(): RoleDefinition[] {
    return Object.keys(this.roleMap).map((key) => ({
      key: key as SubjectRoleType,
      label: key,
    }));
  }
  getAllowedTypes(role: SubjectRoleType): SubjectType[] {
    return this.roleMap[role] || [];
  }
}
