import { IFilterValidationStrategy } from '../contracts/filter-validator.interface';
import { PartialSearchFilters, ValidationError } from '../../search/domain';
import { DIDAIFormation } from '../../search/domain/search.enum';

export class FormationModeContradictionStrategy implements IFilterValidationStrategy {
  public validate(filters: PartialSearchFilters): Map<string, ValidationError[]> {
    const errors = new Map<string, ValidationError[]>();

    const mode = filters.diDai?.modalitaFormazione;
    const conformitaCopie = filters.diDai?.verifica?.conformitaCopie;

    if (!mode || conformitaCopie === null || conformitaCopie === undefined) {
      return errors;
    }

    const isModeB = mode === ('b' as DIDAIFormation) || mode === ('B' as DIDAIFormation);

    if (!isModeB) {
      this.addError(errors, 'diDai.verifica.conformitaCopie', {
        field: 'diDai.verifica.conformitaCopie',
        code: 'ERR_CONF_FORM_001',
        message:
          'Contraddizione: la "Conformità copie immagine" può essere ricercata solo se la modalità di formazione è "B".',
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
}
