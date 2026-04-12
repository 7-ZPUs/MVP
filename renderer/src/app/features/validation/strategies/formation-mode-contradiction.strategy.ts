import { IFilterValidationStrategy } from '../contracts/filter-validator.interface';
import { PartialSearchFilters, ValidationError } from '../../../../../../shared/domain/metadata';
import { DIDAIFormation } from '../../../../../../shared/domain/metadata/search.enum';

export class FormationModeContradictionStrategy implements IFilterValidationStrategy {
  public validate(filters: PartialSearchFilters): Map<string, ValidationError[]> {
    const errors = new Map<string, ValidationError[]>();

    const mode = filters.diDai?.modalitaFormazione;
    const conformitaCopie = filters.diDai?.verifica?.conformitaCopie;

    if (!mode || conformitaCopie === null || conformitaCopie === undefined) {
      return errors;
    }

    const isModeB = this.isConformitaCompatibleMode(mode);

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

  private isConformitaCompatibleMode(mode: DIDAIFormation | null | undefined): boolean {
    if (!mode) {
      return false;
    }

    if (typeof mode !== 'string') {
      return false;
    }

    const normalized = mode.trim().toLowerCase();
    const normalizedAcquisizione = DIDAIFormation.ACQUISIZIONE.trim().toLowerCase();

    // Legacy compatibility for historical saved filters that used letter codes.
    if (normalized === 'b') {
      return true;
    }

    // Current UI emits full enum string; this keeps validation aligned with the active options.
    if (normalized === normalizedAcquisizione) {
      return true;
    }

    // Defensive fallback for older canonicalized variants.
    return normalized.startsWith('acquisizione di un documento informatico per via telematica');
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
