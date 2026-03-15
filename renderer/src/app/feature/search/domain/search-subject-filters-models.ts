import { SubjectRoleType, SubjectType } from './search.enum';

export interface SoggettoFilter {
  ruoloSoggetto: SubjectRoleType | string | null;
  tipoSoggetto: SubjectType | null;
}
