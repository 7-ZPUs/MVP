import { IFilterValidationStrategy } from '../contracts/filter-validator.interface';
import { PartialSearchFilters, ValidationError } from '../../../../../../shared/domain/metadata';
import { RegisterType } from '../../../../../../shared/domain/metadata/search.enum';

export class RegistryContradictionValidationStrategy implements IFilterValidationStrategy {
  public validate(filters: PartialSearchFilters): Map<string, ValidationError[]> {
    const errors = new Map<string, ValidationError[]>();

    // Accediamo al blocco registrazione tipizzato in base ai tuoi modelli
    const registrazione = filters.diDai?.registrazione;

    if (!registrazione) {
      return errors;
    }

    // Ricerca contraddittoria: cerco documenti SENZA registro, ma specifico un dato di registro
    if (registrazione.tipologiaRegistro === RegisterType.NESSUNO) {
      if (this.hasValue(registrazione.codiceRegistro)) {
        this.addError(errors, 'diDai.registrazione.codiceRegistro', {
          field: 'diDai.registrazione.codiceRegistro',
          code: 'ERR_CONF_REG_001',
          message:
            'Contraddizione: hai specificato un Codice Registro, ma hai filtrato per Tipologia Registro "Nessuno".',
        });
      }

      if (this.hasValue(registrazione.numeroRegistrazione)) {
        this.addError(errors, 'diDai.registrazione.numeroRegistrazione', {
          field: 'diDai.registrazione.numeroRegistrazione',
          code: 'ERR_CONF_REG_002',
          message:
            'Contraddizione: hai specificato un Numero di Registrazione, ma hai filtrato per Tipologia Registro "Nessuno".',
        });
      }
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
