import { IDocContextStrategy, RoleDefinition } from '../contracts/doc-context-strategy.interface';
import {
  SubjectRoleType,
  SubjectType,
} from '../../../../../../shared/domain/metadata/subject.enum';

export class DiContextStrategy implements IDocContextStrategy {
  private readonly roleMap: Partial<Record<SubjectRoleType, SubjectType[]>> = {
    [SubjectRoleType.AUTORE]: [SubjectType.PF, SubjectType.PG, SubjectType.PAI, SubjectType.PAE],
    [SubjectRoleType.DESTINATARIO]: [
      SubjectType.PF,
      SubjectType.PG,
      SubjectType.PAI,
      SubjectType.PAE,
    ],
    [SubjectRoleType.MITTENTE]: [SubjectType.PF, SubjectType.PG, SubjectType.PAI, SubjectType.PAE],
    [SubjectRoleType.OPERATORE]: [SubjectType.PF],
    [SubjectRoleType.PRODUTTORE]: [SubjectType.SW],
    [SubjectRoleType.RGD]: [SubjectType.PF],
    [SubjectRoleType.RSP]: [SubjectType.PF],
    [SubjectRoleType.SOGGETTO_REGISTRAZIONE]: [SubjectType.PF, SubjectType.PG],
    [SubjectRoleType.ASSEGNATARIO]: [SubjectType.AS],
    [SubjectRoleType.ALTRO]: [SubjectType.PF, SubjectType.PG, SubjectType.PAI, SubjectType.PAE],
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
