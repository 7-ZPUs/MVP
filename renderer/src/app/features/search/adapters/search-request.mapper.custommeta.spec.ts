import { describe, expect, it } from 'vitest';
import { toSearchRequestDTO, hasMeaningfulAdvancedFilters } from './search-request.mapper';
import {
  SearchFilters,
  SearchGroupDTO,
  SearchConditionDTO,
} from '../../../../../../shared/domain/metadata/search.models';
import { DocumentType } from '../../../../../../shared/domain/metadata/search.enum';

function buildFilters(
  customMeta: SearchFilters['customMeta'],
  tipoDocumento: DocumentType | null = DocumentType.DOCUMENTO_INFORMATICO,
): SearchFilters {
  return {
    common: { tipoDocumento } as SearchFilters['common'],
    diDai: {} as SearchFilters['diDai'],
    aggregate: {} as SearchFilters['aggregate'],
    customMeta,
    subject: [],
  };
}

describe('search-request.mapper custom metadata', () => {
  it('treats custom metadata array as meaningful advanced filters', () => {
    const filters = buildFilters([
      { field: 'CustomMetadata.NomeCliente', value: 'Alfa Solutions S.p.A.' },
    ]);

    expect(hasMeaningfulAdvancedFilters(filters)).toBe(true);
  });

  it('maps a custom metadata array into LIKE conditions', () => {
    const dto = toSearchRequestDTO(
      buildFilters([{ field: 'CustomMetadata.NomeCliente', value: 'Alfa Solutions S.p.A.' }]),
    );

    expect(dto).not.toBeNull();
    expect(dto?.filter.items).toContainEqual(
      expect.objectContaining({
        logicOperator: 'AND',
        items: expect.arrayContaining([
          expect.objectContaining({
            path: 'DocumentoInformatico.CustomMetadata.NomeCliente',
            operator: 'LIKE',
            value: '%Alfa Solutions S.p.A.%',
          }),
        ]),
      }),
    );
  });

  it('maps a plain key to the selected document root custom metadata path', () => {
    const dto = toSearchRequestDTO(
      buildFilters(
        [{ field: 'NomeCliente', value: 'Alfa Solutions S.p.A.' }],
        DocumentType.DOCUMENTO_AMMINISTRATIVO_INFORMATICO,
      ),
    );

    expect(dto).not.toBeNull();
    expect(dto?.filter.items).toContainEqual(
      expect.objectContaining({
        logicOperator: 'AND',
        items: expect.arrayContaining([
          expect.objectContaining({
            path: 'DocumentoAmministrativoInformatico.CustomMetadata.NomeCliente',
            operator: 'LIKE',
            value: '%Alfa Solutions S.p.A.%',
          }),
        ]),
      }),
    );
  });

  it('maps legacy full path DocumentoInformatico.CustomMetadata.Key preserving rooted path', () => {
    const dto = toSearchRequestDTO(
      buildFilters([
        {
          field: 'DocumentoInformatico.CustomMetadata.NomeCliente',
          value: 'Alfa Solutions S.p.A.',
        },
      ]),
    );

    expect(dto).not.toBeNull();
    expect(dto?.filter.items).toContainEqual(
      expect.objectContaining({
        logicOperator: 'AND',
        items: expect.arrayContaining([
          expect.objectContaining({
            path: 'DocumentoInformatico.CustomMetadata.NomeCliente',
            operator: 'LIKE',
            value: '%Alfa Solutions S.p.A.%',
          }),
        ]),
      }),
    );
  });

  it('normalizes legacy aggregate root to AggregazioneDocumentaliInformatiche.CustomMetadata.Key', () => {
    const dto = toSearchRequestDTO(
      buildFilters([
        {
          field: 'AggregazioneDocumentale.CustomMetadata.NomeCliente',
          value: 'Alfa Solutions S.p.A.',
        },
      ]),
    );

    expect(dto).not.toBeNull();
    expect(dto?.filter.items).toContainEqual(
      expect.objectContaining({
        logicOperator: 'AND',
        items: expect.arrayContaining([
          expect.objectContaining({
            path: 'AggregazioneDocumentaliInformatiche.CustomMetadata.NomeCliente',
            operator: 'LIKE',
            value: '%Alfa Solutions S.p.A.%',
          }),
        ]),
      }),
    );
  });

  it('maps multiple custom metadata entries with AND semantics', () => {
    const dto = toSearchRequestDTO(
      buildFilters([
        { field: 'CustomMetadata.NomeCliente', value: 'Alfa' },
        { field: 'CustomMetadata.Pagato', value: 'true' },
      ]),
    );

    const groups = (dto?.filter.items ?? []).filter(
      (item): item is SearchGroupDTO =>
        typeof item === 'object' &&
        item !== null &&
        'logicOperator' in item &&
        item.logicOperator === 'AND',
    );
    const conditions = groups.flatMap((group) =>
      group.items.filter(
        (item): item is SearchConditionDTO =>
          typeof item === 'object' && item !== null && 'path' in item,
      ),
    );

    expect(conditions).toContainEqual(
      expect.objectContaining({
        path: 'DocumentoInformatico.CustomMetadata.NomeCliente',
        operator: 'LIKE',
        value: '%Alfa%',
      }),
    );
    expect(conditions).toContainEqual(
      expect.objectContaining({
        path: 'DocumentoInformatico.CustomMetadata.Pagato',
        operator: 'LIKE',
        value: '%true%',
      }),
    );
  });

  it('maps plain key to all supported roots when document type is not selected', () => {
    const dto = toSearchRequestDTO(buildFilters([{ field: 'NomeCliente', value: 'Alfa' }], null));

    expect(dto).not.toBeNull();
    expect(dto?.filter.items).toContainEqual(
      expect.objectContaining({
        logicOperator: 'AND',
        items: expect.arrayContaining([
          expect.objectContaining({
            logicOperator: 'OR',
            items: expect.arrayContaining([
              expect.objectContaining({
                path: 'DocumentoInformatico.CustomMetadata.NomeCliente',
                operator: 'LIKE',
                value: '%Alfa%',
              }),
              expect.objectContaining({
                path: 'DocumentoAmministrativoInformatico.CustomMetadata.NomeCliente',
                operator: 'LIKE',
                value: '%Alfa%',
              }),
              expect.objectContaining({
                path: 'AggregazioneDocumentaliInformatiche.CustomMetadata.NomeCliente',
                operator: 'LIKE',
                value: '%Alfa%',
              }),
            ]),
          }),
        ]),
      }),
    );
  });
});
