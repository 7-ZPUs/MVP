import { DocumentType } from '../../../../../../../../shared/domain/metadata/search.enum';

export interface FilterUIState {
  disableAggregate: boolean;
  disableDiDai: boolean;
  motivoBloccoAggregate: string;
  motivoBloccoDiDai: string;
}

export class FilterRulesManager {
  public static calculateUIState(formValues: any): FilterUIState {
    const tipoDocumento = formValues.common?.tipoDocumento;
    const isDiDai =
      tipoDocumento === DocumentType.DOCUMENTO_AMMINISTRATIVO_INFORMATICO ||
      tipoDocumento === DocumentType.DOCUMENTO_INFORMATICO;
    const isAggregate = tipoDocumento === DocumentType.AGGREGAZIONE_DOCUMENTALE;

    const hasDiDaiValues = this.hasValoriCompilati(formValues.diDai);
    const hasAggregateValues = this.hasValoriCompilati(formValues.aggregate);

    const state: FilterUIState = {
      disableAggregate: false,
      disableDiDai: false,
      motivoBloccoAggregate: '',
      motivoBloccoDiDai: '',
    };

    if (isDiDai) {
      state.disableAggregate = true;
      state.motivoBloccoAggregate = 'Filtri bloccati: hai selezionato il Tipo Documento.';
    } else if (hasDiDaiValues) {
      state.disableAggregate = true;
      state.motivoBloccoAggregate = 'Filtri bloccati: stai compilando i parametri DiDai.';
    }

    if (isAggregate) {
      state.disableDiDai = true;
      state.motivoBloccoDiDai = 'Filtri bloccati: hai selezionato il Tipo Fascicolo.';
    } else if (hasAggregateValues) {
      state.disableDiDai = true;
      state.motivoBloccoDiDai = 'Filtri bloccati: stai compilando i parametri Aggregazione.';
    }

    return state;
  }

  public static hasValoriCompilati(obj: any): boolean {
    if (!obj || typeof obj !== 'object') return false;
    if (obj instanceof Date) return true;
    return Object.values(obj).some((val) => {
      if (val === null || val === undefined) return false;
      if (typeof val === 'string' && val.trim() === '') return false;
      if (val === false) return false;
      if (Array.isArray(val) && val.length === 0) return false;
      if (typeof val === 'object' && !(val instanceof Date)) {
        return this.hasValoriCompilati(val);
      }
      
      return true;
    });
  }
}
