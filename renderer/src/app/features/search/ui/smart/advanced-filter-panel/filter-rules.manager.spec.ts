import { describe, it, expect } from 'vitest';
import { FilterRulesManager } from './filter-rules.manager';
import { DocumentType } from '../../../../../../../../shared/domain/metadata/search.enum';

describe('FilterRulesManager', () => {
  describe('calculateUIState()', () => {
    it('should not block any filters when form is empty or null', () => {
      const state = FilterRulesManager.calculateUIState({});
      expect(state.disableAggregate).toBe(false);
      expect(state.disableDiDai).toBe(false);
      expect(state.motivoBloccoAggregate).toBe('');
      expect(state.motivoBloccoDiDai).toBe('');
    });

    it('should block Aggregate filters when tipoDocumento is DOCUMENTO_INFORMATICO', () => {
      const state = FilterRulesManager.calculateUIState({
        common: { tipoDocumento: DocumentType.DOCUMENTO_INFORMATICO },
      });
      expect(state.disableAggregate).toBe(true);
      expect(state.motivoBloccoAggregate).toBe('Filtri bloccati: hai selezionato il Tipo Documento.');
      expect(state.disableDiDai).toBe(false);
    });

    it('should block Aggregate filters when tipoDocumento is DOCUMENTO_AMMINISTRATIVO_INFORMATICO', () => {
      const state = FilterRulesManager.calculateUIState({
        common: { tipoDocumento: DocumentType.DOCUMENTO_AMMINISTRATIVO_INFORMATICO },
      });
      expect(state.disableAggregate).toBe(true);
      expect(state.motivoBloccoAggregate).toBe('Filtri bloccati: hai selezionato il Tipo Documento.');
    });

    it('should block Aggregate filters when diDai fields are compiled', () => {
      const state = FilterRulesManager.calculateUIState({
        diDai: { campo: 'valore valido' },
      });
      expect(state.disableAggregate).toBe(true);
      expect(state.motivoBloccoAggregate).toBe('Filtri bloccati: stai compilando i parametri DiDai.');
    });

    it('should block DiDai filters when tipoDocumento is AGGREGAZIONE_DOCUMENTALE', () => {
      const state = FilterRulesManager.calculateUIState({
        common: { tipoDocumento: DocumentType.AGGREGAZIONE_DOCUMENTALE },
      });
      expect(state.disableDiDai).toBe(true);
      expect(state.motivoBloccoDiDai).toBe('Filtri bloccati: hai selezionato il Tipo Fascicolo.');
      expect(state.disableAggregate).toBe(false);
    });

    it('should block DiDai filters when aggregate fields are compiled', () => {
      const state = FilterRulesManager.calculateUIState({
        aggregate: { numero: 123 },
      });
      expect(state.disableDiDai).toBe(true);
      expect(state.motivoBloccoDiDai).toBe('Filtri bloccati: stai compilando i parametri Aggregazione.');
    });
  });

  describe('hasValoriCompilati()', () => {
    it('should return false for null, undefined, or primitive types (not an object)', () => {
      expect(FilterRulesManager.hasValoriCompilati(null)).toBe(false);
      expect(FilterRulesManager.hasValoriCompilati(undefined)).toBe(false);
      expect(FilterRulesManager.hasValoriCompilati('just a string')).toBe(false);
      expect(FilterRulesManager.hasValoriCompilati(123)).toBe(false);
      expect(FilterRulesManager.hasValoriCompilati(true)).toBe(false);
    });

    it('should return true if the object itself is a Date', () => {
      expect(FilterRulesManager.hasValoriCompilati(new Date())).toBe(true);
    });

    it('should return false for objects containing only null, undefined, or empty strings', () => {
      expect(FilterRulesManager.hasValoriCompilati({ a: null, b: undefined, c: '', d: '   ' })).toBe(false);
    });

    it('should return false for objects containing false boolean values', () => {
      expect(FilterRulesManager.hasValoriCompilati({ a: false })).toBe(false);
    });

    it('should return false for objects containing empty arrays', () => {
      expect(FilterRulesManager.hasValoriCompilati({ items: [] })).toBe(false);
    });

    it('should return false recursively for nested objects with only empty values', () => {
      expect(FilterRulesManager.hasValoriCompilati({ wrapper: { nested: { prop: '' } } })).toBe(false);
    });

    it('should return true for objects containing a nested Date', () => {
      expect(FilterRulesManager.hasValoriCompilati({ dateProp: new Date() })).toBe(true);
    });

    it('should return true for nested objects with at least one valid value', () => {
      expect(FilterRulesManager.hasValoriCompilati({ wrapper: { nested: { prop: 'valid' } } })).toBe(true);
    });

    it('should return true for objects containing numbers, true booleans, or populated arrays', () => {
      expect(FilterRulesManager.hasValoriCompilati({ numberProp: 0 })).toBe(true); // 0 is a valid compiled value
      expect(FilterRulesManager.hasValoriCompilati({ booleanProp: true })).toBe(true);
      expect(FilterRulesManager.hasValoriCompilati({ arrayProp: [1, 2, 3] })).toBe(true);
    });
  });
});