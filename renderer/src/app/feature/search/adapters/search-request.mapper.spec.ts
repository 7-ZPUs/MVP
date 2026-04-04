import { describe, expect, it } from 'vitest';
import { SubjectRoleType, SubjectType } from '../../../../../../shared/domain/metadata/search.enum';
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

  it('keeps custom path as-is and applies LIKE', () => {
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
            value: 'FASCICOLO',
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
});
