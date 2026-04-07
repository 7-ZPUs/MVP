
import { Pipe, PipeTransform } from '@angular/core';
import { getIntegrityClass } from '../../search/utilities/integrity-status.utility';
import { IntegrityStatusEnum } from '../../../shared/domain/value-objects/IntegrityStatusEnum';

@Pipe({ name: 'integrityClass', standalone: true })
export class IntegrityClassPipe implements PipeTransform {
  transform(status: IntegrityStatusEnum): string {
    return getIntegrityClass(status);
  }
}