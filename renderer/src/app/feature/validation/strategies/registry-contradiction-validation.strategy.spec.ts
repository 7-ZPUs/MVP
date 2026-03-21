import { describe, it, expect, beforeEach } from 'vitest';
import { RegistryContradictionValidationStrategy } from './registry-contradiction-validation.strategy';
import { PartialSearchFilters } from '../../search/domain';
import { RegisterType } from '../../search/domain/search.enum';

describe('RegistryContradictionValidationStrategy', () => {
  let strategy: RegistryContradictionValidationStrategy;

  beforeEach(() => {
    strategy = new RegistryContradictionValidationStrategy();
  });

  describe('Assenza del blocco principale', () => {
    it('NON dovrebbe eseguire validazioni se manca il blocco diDai o registrazione', () => {
      const filters = { diDai: { registrazione: null } } as unknown as PartialSearchFilters;
      const result = strategy.validate(filters);
      expect(result.size).toBe(0);
    });
  });

  describe('Contraddizioni Logiche', () => {
    it('dovrebbe segnalare errore se cerco Tipo "Nessuno" ma inserisco un codiceRegistro', () => {
      const filters = {
        diDai: {
          registrazione: {
            tipologiaRegistro: RegisterType.NESSUNO,
            codiceRegistro: 'REG-123',
            numeroRegistrazione: null,
          },
        },
      } as unknown as PartialSearchFilters;

      const result = strategy.validate(filters);

      expect(result.has('diDai.registrazione.codiceRegistro')).toBe(true);
      expect(result.get('diDai.registrazione.codiceRegistro')?.[0].code).toBe('ERR_CONF_REG_001');
    });

    it('dovrebbe segnalare errore se cerco Tipo "Nessuno" ma inserisco un numeroRegistrazione (copre ramo hasValue su numero)', () => {
      const filters = {
        diDai: {
          registrazione: {
            tipologiaRegistro: RegisterType.NESSUNO,
            codiceRegistro: null,
            numeroRegistrazione: 404,
          },
        },
      } as unknown as PartialSearchFilters;

      const result = strategy.validate(filters);

      expect(result.has('diDai.registrazione.numeroRegistrazione')).toBe(true);
      expect(result.get('diDai.registrazione.numeroRegistrazione')?.[0].code).toBe(
        'ERR_CONF_REG_002',
      );
    });

    it('dovrebbe segnalare entrambi gli errori se tutti e due i campi sono compilati assieme a Tipo "Nessuno"', () => {
      const filters = {
        diDai: {
          registrazione: {
            tipologiaRegistro: RegisterType.NESSUNO,
            codiceRegistro: 'REG-123',
            numeroRegistrazione: 404,
          },
        },
      } as unknown as PartialSearchFilters;

      const result = strategy.validate(filters);

      expect(result.size).toBe(2);
      expect(result.has('diDai.registrazione.codiceRegistro')).toBe(true);
      expect(result.has('diDai.registrazione.numeroRegistrazione')).toBe(true);
    });
  });

  describe('Ricerche Valide (Filtri Parziali)', () => {
    it('NON dovrebbe segnalare errore se cerco Tipo "Nessuno" e lascio i campi vuoti (ricerca lecita)', () => {
      const filters = {
        diDai: {
          registrazione: {
            tipologiaRegistro: RegisterType.NESSUNO,
            codiceRegistro: '  ', // stringa vuota ignorata
            numeroRegistrazione: null,
          },
        },
      } as unknown as PartialSearchFilters;

      const result = strategy.validate(filters);
      expect(result.size).toBe(0);
    });

    it('NON dovrebbe segnalare errore se cerco un Tipo di protocollo valido (es. ORDINARIO) e inserisco i campi', () => {
      // Simula qualsiasi altro valore Enum (es. RegisterType.PROTOCOLLO_ORDINARIO)
      const filters = {
        diDai: {
          registrazione: {
            tipologiaRegistro: 'Protocollo Ordinario/Protocollo Emergenza' as RegisterType,
            codiceRegistro: 'REG-123',
            numeroRegistrazione: 404,
          },
        },
      } as unknown as PartialSearchFilters;

      const result = strategy.validate(filters);
      expect(result.size).toBe(0);
    });
  });
});
