import { describe, expect, it } from 'vitest';
import {
  AggregationType,
  DIDAIFormation,
  RegisterType,
  SubjectRoleType,
  SubjectType,
} from '../../../../../../shared/domain/metadata/search.enum';
import { hasMeaningfulAdvancedFilters, toSearchRequestDTO } from './search-request.mapper';

describe('search-request.mapper', () => {
  it('returns null for empty advanced filters', () => {
    const dto = toSearchRequestDTO({
      common: {},
      diDai: {},
      aggregate: {},
      customMeta: null,
      subject: [],
    } as any);

    expect(dto).toBeNull();
    expect(
      hasMeaningfulAdvancedFilters({
        common: {},
        diDai: {},
        aggregate: {},
        customMeta: null,
        subject: [],
      } as any),
    ).toBe(false);
  });

  it('maps text filters with LIKE contains', () => {
    const dto = toSearchRequestDTO({
      common: { note: 'protocollo' },
      diDai: {},
      aggregate: {},
      customMeta: null,
      subject: [],
    } as any);

    expect(dto).not.toBeNull();
    expect(dto?.filter.items).toContainEqual(
      expect.objectContaining({
        logicOperator: 'AND',
        items: expect.arrayContaining([
          expect.objectContaining({
            path: 'DocumentoInformatico.Note',
            operator: 'LIKE',
            value: '%protocollo%',
          }),
        ]),
      }),
    );
  });

  it('normalizes custom metadata path to DocumentoRoot.CustomMetadata.Key and applies LIKE', () => {
    const dto = toSearchRequestDTO({
      common: {},
      diDai: {},
      aggregate: {},
      customMeta: { field: 'DocumentoInformatico.CustomMetadata.NomeCliente', value: 'Acme' },
      subject: [],
    } as any);

    expect(dto?.filter.items).toContainEqual(
      expect.objectContaining({
        logicOperator: 'AND',
        items: expect.arrayContaining([
          expect.objectContaining({
            path: 'DocumentoInformatico.CustomMetadata.NomeCliente',
            operator: 'LIKE',
            value: '%Acme%',
          }),
        ]),
      }),
    );
  });

  it('maps aggregate filters under AggregazioneDocumentale root', () => {
    const dto = toSearchRequestDTO({
      common: {},
      diDai: {},
      aggregate: { tipoAggregazione: 'FASCICOLO', idAggregazione: 'A-123' },
      customMeta: null,
      subject: [],
    } as any);

    expect(dto?.filter.items).toContainEqual(
      expect.objectContaining({
        logicOperator: 'AND',
        items: expect.arrayContaining([
          expect.objectContaining({
            path: 'AggregazioneDocumentale.TipoAgg.TipoAggregazione',
            operator: 'EQ',
            value: 'Fascicolo',
          }),
          expect.objectContaining({
            path: 'AggregazioneDocumentale.TipoAgg.IdAggregazione',
            operator: 'EQ',
            value: 'A-123',
          }),
        ]),
      }),
    );
  });

  it('maps subject criteria including role/type/details with ELEM_MATCH', () => {
    const dto = toSearchRequestDTO({
      common: {},
      diDai: {},
      aggregate: {},
      customMeta: null,
      subject: [
        {
          role: SubjectRoleType.MITTENTE,
          type: SubjectType.PF,
          details: { cognomePF: 'Rossi', nomePF: 'Mario' },
        },
      ],
    } as any);

    const subjectGroup = (dto?.filter.items as any[]).find((g) => g.logicOperator === 'OR');
    expect(subjectGroup).toBeDefined();
    expect(subjectGroup.items[0]).toEqual(
      expect.objectContaining({
        path: 'DocumentoInformatico.Soggetti.Ruolo',
        operator: 'ELEM_MATCH',
      }),
    );
  });

  it('does not emit container-level conditions for subject type wrappers', () => {
    const dto = toSearchRequestDTO({
      common: {},
      diDai: {},
      aggregate: {},
      customMeta: null,
      subject: [
        {
          role: SubjectRoleType.ALTRO,
          type: SubjectType.PF,
          details: { cognomePF: 'Rossi', nomePF: 'Paolo' },
        },
      ],
    } as any);

    const subjectGroup = (dto?.filter.items as any[]).find((g) => g.logicOperator === 'OR');
    const elemMatch = subjectGroup.items[0];
    const nestedItems = elemMatch.value.items as any[];

    expect(nestedItems).toContainEqual(
      expect.objectContaining({
        path: 'Altro.TipoRuolo',
        operator: 'EQ',
        value: 'Altro',
      }),
    );
    expect(nestedItems).not.toContainEqual(
      expect.objectContaining({
        path: 'Altro.PF',
      }),
    );
    expect(nestedItems).toContainEqual(
      expect.objectContaining({
        path: 'Altro.PF.Cognome',
        operator: 'LIKE',
        value: '%Rossi%',
      }),
    );
    expect(nestedItems).toContainEqual(
      expect.objectContaining({
        path: 'Altro.PF.Nome',
        operator: 'LIKE',
        value: '%Paolo%',
      }),
    );
  });

  it('maps role and type wrappers aligned with Soggetti XML structure', () => {
    const dto = toSearchRequestDTO({
      common: {},
      diDai: {},
      aggregate: {},
      customMeta: null,
      subject: [
        {
          role: SubjectRoleType.RGD,
          type: SubjectType.PF,
          details: { cognomeRUP: 'Colombo', nomeRUP: 'Marco' },
        },
      ],
    } as any);

    const subjectGroup = (dto?.filter.items as any[]).find((g) => g.logicOperator === 'OR');
    const elemMatch = subjectGroup.items[0];
    const nestedItems = elemMatch.value.items as any[];

    expect(nestedItems).toContainEqual(
      expect.objectContaining({
        path: 'ResponsabileGestioneDocumentale.TipoRuolo',
        operator: 'EQ',
        value: 'Responsabile della Gestione Documentale',
      }),
    );
    expect(nestedItems).toContainEqual(
      expect.objectContaining({
        path: 'ResponsabileGestioneDocumentale.PF.Cognome',
        operator: 'LIKE',
        value: '%Colombo%',
      }),
    );
    expect(nestedItems).toContainEqual(
      expect.objectContaining({
        path: 'ResponsabileGestioneDocumentale.PF.Nome',
        operator: 'LIKE',
        value: '%Marco%',
      }),
    );
  });

  it('maps PG Codice Fiscale / Partita IVA to CodiceFiscale_PartitaIva', () => {
    const dto = toSearchRequestDTO({
      common: {},
      diDai: {},
      aggregate: {},
      customMeta: null,
      subject: [
        {
          role: SubjectRoleType.DESTINATARIO,
          type: SubjectType.PG,
          details: { codiceFiscalePartitaIvaPG: '31140103768' },
        },
      ],
    } as any);

    const subjectGroup = (dto?.filter.items as any[]).find((g) => g.logicOperator === 'OR');
    const elemMatch = subjectGroup.items[0];
    const nestedItems = elemMatch.value.items as any[];

    expect(nestedItems).toContainEqual(
      expect.objectContaining({
        path: 'Destinatario.PG.CodiceFiscale_PartitaIva',
        operator: 'EQ',
        value: '31140103768',
      }),
    );
  });

  it('maps predefined diDai values to canonical XSD literals', () => {
    const dto = toSearchRequestDTO({
      common: {},
      diDai: {
        registrazione: { tipologiaRegistro: RegisterType.REPERTORIO },
        modalitaFormazione: DIDAIFormation.EX_NOVO,
      },
      aggregate: {},
      customMeta: null,
      subject: [],
    } as any);

    const group = (dto?.filter.items as any[]).find((g) => g.logicOperator === 'AND');
    const items = group.items as any[];

    expect(items).toContainEqual(
      expect.objectContaining({
        path: 'DocumentoInformatico.DatiDiRegistrazione.TipoRegistro.Repertorio_Registro.TipoRegistro',
        operator: 'EQ',
        value: String.raw`Repertorio\Registro`,
      }),
    );
    expect(items).toContainEqual(
      expect.objectContaining({
        path: 'DocumentoInformatico.ModalitaDiFormazione',
        operator: 'EQ',
        value:
          'creazione tramite utilizzo di strumenti software che assicurino la produzione di documenti nei formati previsti in allegato 2',
      }),
    );
  });

  it('maps predefined aggregate values to canonical XSD literals', () => {
    const dto = toSearchRequestDTO({
      common: {},
      diDai: {},
      aggregate: {
        tipoAggregazione: AggregationType.SERIE_FASCICOLI,
      },
      customMeta: null,
      subject: [],
    } as any);

    const group = (dto?.filter.items as any[]).find((g) => g.logicOperator === 'AND');
    const items = group.items as any[];

    expect(items).toContainEqual(
      expect.objectContaining({
        path: 'AggregazioneDocumentale.TipoAgg.TipoAggregazione',
        operator: 'EQ',
        value: 'Serie Di Fascicoli',
      }),
    );
  });

  it('maps Riservatezza display labels to boolean values', () => {
    const dto = toSearchRequestDTO({
      common: {},
      diDai: {
        riservatezza: 'Sì',
      },
      aggregate: {},
      customMeta: null,
      subject: [],
    } as any);

    const group = (dto?.filter.items as any[]).find((g) => g.logicOperator === 'AND');
    const items = group.items as any[];

    expect(items).toContainEqual(
      expect.objectContaining({
        path: 'DocumentoInformatico.Riservato',
        operator: 'EQ',
        value: true,
      }),
    );
  });
});
