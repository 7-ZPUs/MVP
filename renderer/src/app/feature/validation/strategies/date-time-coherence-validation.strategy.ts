import { IFilterValidationStrategy } from '../contracts/filter-validator.interface';
import { PartialSearchFilters, ValidationError } from '../../../../../../shared/metadata';

export class DateTimeCoherenceValidationStrategy implements IFilterValidationStrategy {
  public validate(filters: PartialSearchFilters): Map<string, ValidationError[]> {
    const errors = new Map<string, ValidationError[]>();
    const diDai = filters.diDai as any;

    if (!diDai) {
      return errors;
    }

    const dataRegistrazione = diDai.registrazione?.dataRegistrazione;
    const oraRegistrazione = diDai.registrazione?.oraRegistrazione;

    if (this.hasValue(oraRegistrazione) && !this.hasValue(dataRegistrazione)) {
      this.addError(errors, 'diDai.registrazione.dataRegistrazione', {
        field: 'diDai.registrazione.dataRegistrazione',
        code: 'ERR_CONF_DT_001',
        message: "La data di registrazione è obbligatoria quando è specificata l'ora.",
      });
    }

    const tracciature = diDai.tracciatureModifiche;
    if (Array.isArray(tracciature)) {
      tracciature.forEach((tracciatura: any, index: number) => {
        const dataModifica = tracciatura?.dataModifica;
        const oraModifica = tracciatura?.oraModifica;

        if (this.hasValue(oraModifica) && !this.hasValue(dataModifica)) {
          this.addError(errors, `diDai.tracciatureModifiche.${index}.dataModifica`, {
            field: `diDai.tracciatureModifiche.${index}.dataModifica`,
            code: 'ERR_CONF_DT_002',
            message: "La data di modifica è obbligatoria quando è specificata l'ora.",
          });
        }
      });
    }

    return errors;
  }

  private addError(
    map: Map<string, ValidationError[]>,
    field: string,
    error: ValidationError,
  ): void {
    const existing = map.get(field) || [];
    map.set(field, [...existing, error]);
  }

  private hasValue(value: any): boolean {
    return value !== null && value !== undefined && String(value).trim() !== '';
  }
}
