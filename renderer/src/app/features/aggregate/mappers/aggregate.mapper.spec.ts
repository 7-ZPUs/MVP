import { describe, it, expect } from 'vitest';
import { mapProcessDtoToAggregateDetail } from './aggregate.mapper';
import { MetadataNode } from '../../../shared/utils/metadata-nodes.util';

describe('aggregate.mapper', () => {
  describe('mapProcessDtoToAggregateDetail', () => {
    it('should handle undefined or null dto safely and apply default fallback values', () => {
      const result = mapProcessDtoToAggregateDetail(null);

      expect(result.idAgg!.tipoAggregazione).toBe('Fascicolo');
      expect(result.idAgg!.idAggregazione).toBe('');
      expect(result.tipologiaFascicolo).toBe('procedimento amministrativo');
      expect(result.soggetti).toEqual([{ tipoRuolo: 'Sconosciuto', denominazione: 'N/A' }]);
      expect(result.dataApertura).toBe('N/D');
      expect(result.progressivo).toBe(1);
      expect(result.chiaveDescrittiva!.oggetto).toBe('Fascicolo n. ');
      expect(result.procedimentoAmministrativo!.materiaArgomentoStruttura).toBe('Standard');
      expect(result.procedimentoAmministrativo!.procedimento).toBe('N/A');
      expect(result.procedimentoAmministrativo!.fasi).toEqual([]);
      expect(result.posizioneFisicaAggregazioneDocumentale).toBe('Archivio');
      expect(result.tempoDiConservazione).toBe(10);
      expect(result.indiceDocumenti).toEqual([]);
      expect(result.customMetadata).toEqual([]);
    });

    it('should map standard metadata fields correctly', () => {
      const dto = {
        id: '123',
        uuid: 'abc-uuid',
        integrityStatus: 'VALID',
        metadata: [
          { name: 'TipoAggregazione', value: 'Serie' },
          { name: 'IdAggregazione', value: 'AGG-001' },
          { name: 'TipologiaFascicolo', value: 'affare' },
          { name: 'DataApertura', value: '2023-01-01T00:00:00Z' },
          { name: 'DataChiusura', value: '2024-01-01T00:00:00Z' },
          { name: 'Progressivo', value: 42 },
          { name: 'Oggetto', value: 'Fascicolo di Test' },
          { name: 'ParoleChiave', value: 'test, mock' },
          { name: 'PosizioneFisicaAggregazioneDocumentale', value: 'Scaffale A' },
          { name: 'TempoDiConservazione', value: 99 },
          { name: 'Note', value: 'Nota di test' },
          {
            name: 'IdAggPrimario',
            value: [{ name: 'IdAggregazione', value: 'PRIM-001' }],
          },
        ] as MetadataNode[],
      };

      const result = mapProcessDtoToAggregateDetail(dto);

      expect(result.idAgg.tipoAggregazione).toBe('Serie');
      expect(result.idAgg.idAggregazione).toBe('AGG-001');
      expect(result.tipologiaFascicolo).toBe('affare');
      expect(result.dataApertura).toBe('2023-01-01T00:00:00Z');
      expect(result.dataChiusura).toBe('2024-01-01T00:00:00Z');
      expect(result.progressivo).toBe(42);
      expect(result.chiaveDescrittiva.oggetto).toBe('Fascicolo di Test');
      expect(result.chiaveDescrittiva.paroleChiave).toBe('test, mock');
      expect(result.posizioneFisicaAggregazioneDocumentale).toBe('Scaffale A');
      expect(result.tempoDiConservazione).toBe(99);
      expect(result.note).toBe('Nota di test');
      expect(result.idAggPrimario).toBe('PRIM-001');
      expect(result.processSummary!.uuid).toBe('abc-uuid');
      expect(result.processSummary!.integrityStatus).toBe('VALID');
      expect(result.processSummary!.timestamp).toBe('2023-01-01T00:00:00Z');
    });

    it('should map assignment (assegnazione) effectively', () => {
      const dto = {
        metadata: [
          { name: 'TipoAssegnazioneRuolo', value: 'Per conoscenza' },
          { name: 'Nome', value: 'Mario' },
          { name: 'Cognome', value: 'Rossi' },
          { name: 'CodiceFiscale', value: 'RSSMRA' },
          { name: 'DataInizioAssegnazione', value: '2023-05-01' },
          { name: 'DataFineAssegnazione', value: '2023-06-01' },
        ],
      };
      const result = mapProcessDtoToAggregateDetail(dto);
      expect(result.assegnazione.tipoAssegnazione).toBe('Per conoscenza');
      expect(result.assegnazione.soggettoAssegnatario.denominazione).toBe('Mario Rossi');
      expect(result.assegnazione.soggettoAssegnatario.codiceFiscale).toBe('RSSMRA');
      expect(result.assegnazione.dataInizioAssegnazione).toBe('2023-05-01');
      expect(result.assegnazione.dataFineAssegnazione).toBe('2023-06-01');
    });

    describe('Soggetti Mapping', () => {
      it('should map Persona Fisica (PF) subject', () => {
        const dto = {
          metadata: [
            {
              name: 'Ruolo',
              value: [
                { name: 'TipoRuolo', value: 'Mittente' },
                {
                  name: 'PF',
                  value: [
                    { name: 'Nome', value: 'Giuseppe' },
                    { name: 'Cognome', value: 'Verdi' },
                  ],
                },
                { name: 'CodiceFiscale', value: 'VRDGPP' },
                { name: 'IndirizziDigitaliDiRiferimento', value: 'giuseppe@pec.it' },
              ],
            },
          ],
        };
        const result = mapProcessDtoToAggregateDetail(dto);
        expect(result.soggetti).toHaveLength(1);
        expect(result.soggetti[0]).toEqual({
          tipoRuolo: 'Mittente',
          denominazione: 'Giuseppe Verdi',
          codiceFiscale: 'VRDGPP',
          indirizzoDigitale: 'giuseppe@pec.it',
        });
      });

      it('should map Persona Giuridica (PG) subject', () => {
        const dto = {
          metadata: [
            {
              name: 'Ruolo',
              value: [
                { name: 'TipoRuolo', value: 'Destinatario' },
                { name: 'PG', value: 'true' },
                { name: 'DenominazioneOrganizzazione', value: 'Azienda Test SRL' },
                { name: 'CodiceFiscale_PartitaIva', value: '12345678901' },
                { name: 'IndirizziDigitaliDiRiferimento', value: 'azienda@pec.it' },
              ],
            },
          ],
        };
        const result = mapProcessDtoToAggregateDetail(dto);
        expect(result.soggetti).toHaveLength(1);
        expect(result.soggetti[0]).toEqual({
          tipoRuolo: 'Destinatario',
          denominazione: 'Azienda Test SRL',
          codiceFiscale: '12345678901',
          indirizzoDigitale: 'azienda@pec.it',
        });
      });

      it('should map Amministrazione subject', () => {
        const dto = {
          metadata: [
            {
              name: 'Ruolo',
              value: [
                { name: 'AmministrazioneTitolare', value: '' },
                { name: 'TipoRuolo', value: 'Produttore' },
                { name: 'IPAAmm', value: [{ name: 'CodiceIPA', value: 'IPA123' }] },
              ],
            },
          ],
        };
        const result = mapProcessDtoToAggregateDetail(dto);
        expect(result.soggetti).toHaveLength(1);
        expect(result.soggetti[0].tipoRuolo).toBe('Produttore');
        expect(result.soggetti[0].denominazione).toBe('IPA123');
      });

      it('should map RUP subject', () => {
        const dto = {
          metadata: [
            {
              name: 'Ruolo',
              value: [
                { name: 'RUP', value: '' },
                { name: 'Nome', value: 'Luca' },
                { name: 'Cognome', value: 'Bianchi' },
                { name: 'CodiceFiscale', value: 'BNCLCU' },
              ],
            },
          ],
        };
        const result = mapProcessDtoToAggregateDetail(dto);
        expect(result.soggetti).toHaveLength(1);
        expect(result.soggetti[0].tipoRuolo).toBe('RUP');
        expect(result.soggetti[0].denominazione).toBe('Luca Bianchi');
      });

      it('should map fallback plain subject correctly', () => {
        const dto = {
          metadata: [
            {
              name: 'Ruolo',
              value: [{ name: 'Denominazione', value: 'Soggetto Generico' }],
            },
          ],
        };
        const result = mapProcessDtoToAggregateDetail(dto);
        expect(result.soggetti[0].denominazione).toBe('Soggetto Generico');
        expect(result.soggetti[0].tipoRuolo).toBe('Sconosciuto');
      });
    });

    describe('Document Indices Mapping', () => {
      it('should map DocumentoAmministrativoInformatico', () => {
        const dto = {
          metadata: [
            {
              name: 'TipoDocumento',
              value: [
                { name: 'DocumentoAmministrativoInformatico', value: '' },
                { name: 'Identificativo', value: 'DOC-AMM-1' },
                { name: 'Impronta', value: 'HASH123' },
              ],
            },
          ],
        };
        const result = mapProcessDtoToAggregateDetail(dto);
        expect(result.indiceDocumenti).toHaveLength(1);
        expect(result.indiceDocumenti[0]).toEqual({
          tipoDocumento: 'DocumentoAmministativoinformatico',
          identificativo: 'DOC-AMM-1',
          impronta: 'HASH123',
        });
      });

      it('should map DocumentoInformatico', () => {
        const dto = {
          metadata: [
            {
              name: 'TipoDocumento',
              value: [
                { name: 'DocumentoInformatico', value: '' },
                { name: 'Identificativo', value: 'DOC-INF-2' },
                { name: 'Impronta', value: 'HASH456' },
              ],
            },
          ],
        };
        const result = mapProcessDtoToAggregateDetail(dto);
        expect(result.indiceDocumenti).toHaveLength(1);
        expect(result.indiceDocumenti[0]).toEqual({
          tipoDocumento: 'Documentoinformatico',
          identificativo: 'DOC-INF-2',
          impronta: 'HASH456',
        });
      });

      it('should map unknown document types as generic Documento', () => {
        const dto = {
          metadata: [
            {
              name: 'TipoDocumento',
              value: [
                { name: 'AltroNodo', value: '' },
                { name: 'Identificativo', value: 'DOC-GEN-3' },
              ],
            },
          ],
        };
        const result = mapProcessDtoToAggregateDetail(dto);
        expect(result.indiceDocumenti).toHaveLength(1);
        expect(result.indiceDocumenti[0]).toEqual({
          tipoDocumento: 'Documento',
          identificativo: 'DOC-GEN-3',
          impronta: undefined,
        });
      });
    });

    describe('Fasi Mapping', () => {
      it('should map fasi correctly', () => {
        const dto = {
          metadata: [
            {
              name: 'Fase',
              value: [
                { name: 'TipoFase', value: 'Istruttoria' },
                { name: 'DataInizioFase', value: '2023-01-01' },
                { name: 'DataFineFase', value: '2023-01-31' },
              ],
            },
            {
              name: 'Fase',
              value: [
                { name: 'TipoFase', value: 'Decisionale' },
                { name: 'DataInizio', value: '2023-02-01' },
                { name: 'DataFine', value: '2023-02-15' },
              ],
            },
          ],
        };
        const result = mapProcessDtoToAggregateDetail(dto);
        expect(result.procedimentoAmministrativo!.fasi).toHaveLength(2);
        expect(result.procedimentoAmministrativo!.fasi[0]).toEqual({
          tipoFase: 'Istruttoria',
          dataInizio: '2023-01-01',
          dataFine: '2023-01-31',
        });
        expect(result.procedimentoAmministrativo!.fasi[1]).toEqual({
          tipoFase: 'Decisionale',
          dataInizio: '2023-02-01',
          dataFine: '2023-02-15',
        });
      });
    });

    describe('Custom Metadata', () => {
      it('should extract explicit custom data like CustomMetadata and ArchimemoData', () => {
        const dto = {
          metadata: [
            {
              name: 'CustomMetadata',
              value: [{ name: 'CampoExtra1', value: 'Valore 1' }],
            },
            {
              name: 'ArchimemoData',
              value: [{ name: 'CampoExtra2', value: 'Valore 2' }],
            },
          ],
        };
        const result = mapProcessDtoToAggregateDetail(dto);
        expect(result.customMetadata).toEqual(
          expect.arrayContaining([
            { nome: 'CampoExtra1', valore: 'Valore 1' },
            { nome: 'CampoExtra2', valore: 'Valore 2' },
          ]),
        );
      });

      it('should extract generic unmapped roots missing from known blocks', () => {
        const dto = {
          metadata: [
            { name: 'IdAgg', value: 'Ignored because its known' },
            {
              name: 'UnknownTag123',
              value: 'Value123',
            },
          ],
        };

        const result = mapProcessDtoToAggregateDetail(dto);
        // Using extracted generics logic
        expect(result.customMetadata).toEqual(
          expect.arrayContaining([{ nome: 'UnknownTag123', valore: 'Value123' }]),
        );
      });
    });
  });
});
