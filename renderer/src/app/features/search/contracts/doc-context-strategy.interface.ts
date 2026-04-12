import {
  SubjectRoleType,
  SubjectType,
} from '../../../../../../shared/domain/metadata/subject.enum';

export interface RoleDefinition {
  key: SubjectRoleType;
  label: string;
}

export interface IDocContextStrategy {
  getAvailableRoles(): RoleDefinition[];
  getAllowedTypes(role: SubjectRoleType): SubjectType[];
}
