import { IFilterValidationStrategy } from '../contracts/filter-validator.interface';
import { PartialSearchFilters, ValidationError } from '../../../../../../shared/metadata';

export class SearchRangeValidationStrategy implements IFilterValidationStrategy {
  public validate(filters: PartialSearchFilters): Map<string, ValidationError[]> {
    const errors = new Map<string, ValidationError[]>();
    const common = filters.common as any;
    const aggregate = filters.aggregate as any;

    if (common) {
      const dataDa = common.dataDa;
      const dataA = common.dataA;

      if (this.hasValue(dataDa) && this.hasValue(dataA)) {
        if (dataDa > dataA) {
          this.addError(errors, 'common.dataDa', {
            field: 'common.dataDa',
            code: 'ERR_RANGE_001',
            message: 'La data di inizio non può essere successiva alla data di fine.',
          });
        }
      }

      const allegatiMin = common.numeroAllegatiMin;
      const allegatiMax = common.numeroAllegatiMax;

      if (this.isNumber(allegatiMin) && this.isNumber(allegatiMax)) {
        if (allegatiMin > allegatiMax) {
          this.addError(errors, 'common.numeroAllegatiMin', {
            field: 'common.numeroAllegatiMin',
            code: 'ERR_RANGE_002',
            message: 'Il valore minimo non può superare il valore massimo.',
          });
        }
      }
    }

    if (aggregate) {
      const dataApertura = aggregate.dataApertura;
      const dataChiusura = aggregate.dataChiusura;

      if (
        this.hasValue(dataApertura) &&
        this.hasValue(dataChiusura) &&
        dataApertura > dataChiusura
      ) {
        this.addError(errors, 'aggregate.dataApertura', {
          field: 'aggregate.dataApertura',
          code: 'ERR_RANGE_001',
          message: 'La data di inizio non può essere successiva alla data di fine.',
        });
      }

      const dataInizioAssegn = aggregate.assegnazione?.dataInizioAssegn;
      const dataFineAssegn = aggregate.assegnazione?.dataFineAssegn;

      if (
        this.hasValue(dataInizioAssegn) &&
        this.hasValue(dataFineAssegn) &&
        dataInizioAssegn > dataFineAssegn
      ) {
        this.addError(errors, 'aggregate.assegnazione.dataInizioAssegn', {
          field: 'aggregate.assegnazione.dataInizioAssegn',
          code: 'ERR_RANGE_001',
          message: 'La data di inizio non può essere successiva alla data di fine.',
        });
      }

      const fasi = aggregate.procedimento?.fasi;
      if (Array.isArray(fasi)) {
        fasi.forEach((fase: any, index: number) => {
          const dataInizioFase = fase?.dataInizioFase;
          const dataFineFase = fase?.dataFineFase;

          if (
            this.hasValue(dataInizioFase) &&
            this.hasValue(dataFineFase) &&
            dataInizioFase > dataFineFase
          ) {
            this.addError(errors, `aggregate.procedimento.fasi.${index}.dataInizioFase`, {
              field: `aggregate.procedimento.fasi.${index}.dataInizioFase`,
              code: 'ERR_RANGE_001',
              message: 'La data di inizio non può essere successiva alla data di fine.',
            });
          }
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

  private isNumber(value: any): boolean {
    return value !== null && value !== undefined && typeof value === 'number';
  }
}
