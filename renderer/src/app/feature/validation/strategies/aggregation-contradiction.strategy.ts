import { IFilterValidationStrategy } from '../contracts/filter-validator.interface';
import {
  PartialSearchFilters,
  ValidationError,
  AggregateFilterValues,
} from '../../../../../../shared/metadata';
import { AggregationType, FascicoloType } from '../../../../../../shared/metadata/search.enum';

export class AggregationContradictionStrategy implements IFilterValidationStrategy {
  public validate(filters: PartialSearchFilters): Map<string, ValidationError[]> {
    const errors = new Map<string, ValidationError[]>();
    const aggregate = filters.aggregate;

    if (!aggregate) {
      return errors;
    }

    this.checkFascicoloContradictions(aggregate, errors);
    this.checkProcedimentoContradictions(aggregate, errors);
    this.checkAssegnazioneContradictions(aggregate, errors);

    return errors;
  }

  private checkFascicoloContradictions(
    aggregate: AggregateFilterValues,
    errors: Map<string, ValidationError[]>,
  ): void {
    const hasTipoAggregazione = !!aggregate.tipoAggregazione;
    const isNotFascicolo =
      hasTipoAggregazione && aggregate.tipoAggregazione !== AggregationType.FASCICOLO;

    // Se imposto filtri specifici del Fascicolo, ma ho esplicitamente escluso che sia un Fascicolo -> Contraddizione
    if (isNotFascicolo && aggregate.tipoFascicolo) {
      this.addError(errors, 'aggregate.tipoFascicolo', {
        field: 'aggregate.tipoFascicolo',
        code: 'AGG_CNTR_001',
        message:
          'La Tipologia Fascicolo non può essere specificata se il Tipo Aggregazione non è "Fascicolo".',
      });
    }
  }

  private checkProcedimentoContradictions(
    aggregate: AggregateFilterValues,
    errors: Map<string, ValidationError[]>,
  ): void {
    const hasTipoFascicolo = !!aggregate.tipoFascicolo;
    const isNotProcAmm = hasTipoFascicolo && aggregate.tipoFascicolo !== FascicoloType.PROCEDIMENTO;
    const hasProcedimentoFields = this.hasProcedimentoFields(aggregate);

    // Se cerco per campi del Procedimento, ma ho esplicitamente selezionato una Tipologia Fascicolo diversa -> Contraddizione
    if (isNotProcAmm && hasProcedimentoFields) {
      this.addError(errors, 'aggregate.procedimento', {
        field: 'aggregate.procedimento',
        code: 'AGG_CNTR_002',
        message:
          'I filtri del Procedimento Amministrativo sono in contraddizione con la Tipologia Fascicolo selezionata.',
      });
    }
  }

  private checkAssegnazioneContradictions(
    aggregate: AggregateFilterValues,
    errors: Map<string, ValidationError[]>,
  ): void {
    const hasTipoAggregazione = !!aggregate.tipoAggregazione;
    const isNotFascicolo =
      hasTipoAggregazione && aggregate.tipoAggregazione !== AggregationType.FASCICOLO;
    const hasAssegnazione = !this.isAssegnazioneEmpty(aggregate);

    // Se cerco per Assegnazione, ma ho esplicitamente detto che NON è un Fascicolo -> Contraddizione
    if (isNotFascicolo && hasAssegnazione) {
      this.addError(errors, 'aggregate.assegnazione', {
        field: 'aggregate.assegnazione',
        code: 'AGG_CNTR_003',
        message:
          'I filtri di Assegnazione sono applicabili solo quando il Tipo Aggregazione è "Fascicolo".',
      });
    }
  }

  private isAssegnazioneEmpty(aggregate: AggregateFilterValues): boolean {
    if (!aggregate.assegnazione) return true;
    const a = aggregate.assegnazione;
    return !a.tipoAssegnazione && !a.soggettoAssegn && !a.dataInizioAssegn && !a.dataFineAssegn;
  }

  private hasProcedimentoFields(aggregate: AggregateFilterValues): boolean {
    if (!aggregate.procedimento) return false;
    const p = aggregate.procedimento;
    const hasFasi = p.fasi && p.fasi.length > 0;
    return !!(p.materia || p.denominazioneProcedimento || p.URICatalogo || hasFasi);
  }

  private addError(map: Map<string, ValidationError[]>, key: string, error: ValidationError): void {
    const existing = map.get(key) || [];
    existing.push(error);
    map.set(key, existing);
  }
}
