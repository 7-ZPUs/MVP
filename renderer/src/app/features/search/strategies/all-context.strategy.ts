import {
  SubjectRoleType,
  SubjectType,
} from '../../../../../../shared/domain/metadata/subject.enum';
import { IDocContextStrategy, RoleDefinition } from '../contracts/doc-context-strategy.interface';

export class AllContextStrategy implements IDocContextStrategy {
  private readonly roleMap: Record<SubjectRoleType, SubjectType[]> = {
    //(DI, DAI)
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

    //(DI, DAI, AGG)
    [SubjectRoleType.ASSEGNATARIO]: [SubjectType.AS],

    //(DI)
    [SubjectRoleType.SOGGETTO_REGISTRAZIONE]: [SubjectType.PF, SubjectType.PG],
    [SubjectRoleType.ALTRO]: [SubjectType.PF, SubjectType.PG, SubjectType.PAI, SubjectType.PAE],

    //(DAI)
    [SubjectRoleType.AMMINISTRAZIONE_REGISTRAZIONE]: [SubjectType.PAI],

    //(DAI, AGG)
    [SubjectRoleType.RUP]: [SubjectType.RUP],

    //(AGG)
    [SubjectRoleType.AMMINISTRAZIONE_TITOLARE]: [SubjectType.PAI],
    [SubjectRoleType.AMMINISTRAZIONE_PARTECIPANTE]: [SubjectType.PAI, SubjectType.PAE],
    [SubjectRoleType.INTESTATARIO_PF]: [SubjectType.PF],
    [SubjectRoleType.INTESTATARIO_PG]: [SubjectType.PG, SubjectType.PAI, SubjectType.PAE],
  };

  public getAvailableRoles(): RoleDefinition[] {
    return [
      { key: SubjectRoleType.AUTORE, label: 'Autore' },
      { key: SubjectRoleType.DESTINATARIO, label: 'Destinatario' },
      { key: SubjectRoleType.MITTENTE, label: 'Mittente' },
      { key: SubjectRoleType.ASSEGNATARIO, label: 'Assegnatario' },
      { key: SubjectRoleType.SOGGETTO_REGISTRAZIONE, label: 'Sogg. Registrazione (DI)' },
      { key: SubjectRoleType.AMMINISTRAZIONE_REGISTRAZIONE, label: 'Amm. Registrazione (DAI)' },
      { key: SubjectRoleType.OPERATORE, label: 'Operatore' },
      { key: SubjectRoleType.PRODUTTORE, label: 'Produttore (SW)' },
      { key: SubjectRoleType.RGD, label: 'Resp. Gestione Doc.' },
      { key: SubjectRoleType.RSP, label: 'Resp. Servizio Prot.' },
      { key: SubjectRoleType.RUP, label: 'RUP' },
      { key: SubjectRoleType.AMMINISTRAZIONE_TITOLARE, label: 'Amm. Titolare' },
      { key: SubjectRoleType.AMMINISTRAZIONE_PARTECIPANTE, label: 'Amm. Partecipante' },
      { key: SubjectRoleType.INTESTATARIO_PF, label: 'Intestatario (PF)' },
      { key: SubjectRoleType.INTESTATARIO_PG, label: 'Intestatario (PG/PA)' },
      { key: SubjectRoleType.ALTRO, label: 'Altro' },
    ];
  }

  public getAllowedTypes(role: SubjectRoleType): SubjectType[] {
    return this.roleMap[role] || [];
  }
}
