import { describe, it, expect } from 'vitest';
import { mapDocumentDtoToDetail } from './document.mapper';
import { MimeType, SubjectType } from '../domain/document.models';
import { MetadataNode } from '../../../shared/utils/metadata-nodes.util';

describe('document.mapper', () => {
  describe('mapDocumentDtoToDetail', () => {
    it('should handle safely empty, undefined, or null payload', () => {
      const result = mapDocumentDtoToDetail(null);

      // Identity & Base
      expect(result.documentId).toBe('');
      expect(result.fileName).toBe('Documento');
      expect(result.mimeType).toBe(MimeType.UNSUPPORTED);
      expect(result.metadata!.identificativo).toBe('N/A');
      expect(result.metadata!.impronta).toBe('N/A');
      expect(result.integrityStatus).toBeUndefined();

      // Classification & Registration
      expect(result.classification!.indice).toBe('N/A');
      expect(result.registration!.tipoRegistro).toBe('N/A');

      // Defaults
      expect(result.format!.tipo).toBe('N/A');
      expect(result.verification!.firmaDigitale).toBe('N/A');
      expect(result.attachments!.numero).toBe(0);
      expect(result.attachments!.allegati).toEqual([]);
      expect(result.subjects).toEqual([]);
      expect(result.customMetadata).toEqual([]);
    });

    describe('Identity and MimeType', () => {
      it('should extract correct identity and fallback mimeType to extension if missing', () => {
        const dto = {
          id: 'DB-ID-123',
          uuid: 'UUID-456',
          metadata: [{ name: 'NomeDelDocumento', value: 'relazione_tecnica.pdf' }],
        };
        const result = mapDocumentDtoToDetail(dto);

        expect(result.documentId).toBe('DB-ID-123');
        expect(result.aipInfo!.uuid).toBe('UUID-456'); // Part of identity locally mapped
        expect(result.fileName).toBe('relazione_tecnica.pdf');
        expect(result.mimeType).toBe(MimeType.PDF);
      });

      it('should use explicit mimetype from metadata over file extension', () => {
        const dto = {
          metadata: [
            { name: 'NomeDelDocumento', value: 'image_no_ext' },
            { name: 'mimetype', value: 'image/jpeg' },
            { name: 'IdDoc', value: [{ name: 'Identificativo', value: 'META-ID-789' }] },
          ],
        };
        const result = mapDocumentDtoToDetail(dto);

        expect(result.documentId).toBe('META-ID-789');
        expect(result.fileName).toBe('image_no_ext');
        expect(result.mimeType).toBe(MimeType.IMAGE);
      });
    });

    describe('Base Metadata mapping', () => {
      it('should map core metadata properties accurately', () => {
        const dto = {
          metadata: [
            {
              name: 'IdDoc',
              value: [
                { name: 'Identificativo', value: 'DOC-123' },
                {
                  name: 'ImprontaCrittograficaDelDocumento',
                  value: [
                    { name: 'Impronta', value: 'HASH123' },
                    { name: 'Algoritmo', value: 'SHA-512' },
                  ],
                },
              ],
            },
            { name: 'Oggetto', value: 'Oggetto Test' },
            { name: 'TipologiaDocumentale', value: 'Contratto' },
            { name: 'Riservato', value: 'true' },
            { name: 'VersioneDelDocumento', value: '2.0' },
            { name: 'TempoDiConservazione', value: '99' },
            { name: 'ParoleChiave', value: 'test' },
            { name: 'ParoleChiave', value: 'mock' },
          ],
        };

        const result = mapDocumentDtoToDetail(dto);

        expect(result.metadata!.identificativo).toBe('DOC-123');
        expect(result.metadata!.impronta).toBe('HASH123');
        expect(result.metadata!.algoritmoImpronta).toBe('SHA-512');
        expect(result.metadata!.oggetto).toBe('Oggetto Test');
        expect(result.metadata!.tipoDocumentale).toBe('Contratto');
        expect(result.metadata!.riservatezza).toBe('true');
        expect(result.metadata!.versione).toBe('2.0');
        expect(result.metadata!.tempoDiConservazione).toBe('99');
        expect(result.metadata!.paroleChiave).toEqual(['test', 'mock']);
      });
    });

    describe('Registration Data (DatiDiRegistrazione)', () => {
      it('should extract flat registration data', () => {
        const dto = {
          metadata: [
            { name: 'TipoRegistro', value: 'Protocollo Ufficiale' },
            { name: 'DataRegistrazioneDocumento', value: '2023-01-01' },
            { name: 'NumeroRegistrazioneDocumento', value: 'PROT-001' },
          ],
        };
        const result = mapDocumentDtoToDetail(dto);

        expect(result.registration!.tipoRegistro).toBe('Protocollo Ufficiale');
        expect(result.registration!.data).toBe('2023-01-01');
        expect(result.registration!.numero).toBe('PROT-001');
      });

      it('should extract complex nested TipoRegistro', () => {
        const dto = {
          metadata: [
            {
              name: 'TipoRegistro',
              value: [{ name: 'TipoRegistro', value: 'Registro Interno Nested' }],
            },
          ],
        };
        const result = mapDocumentDtoToDetail(dto);
        expect(result.registration!.tipoRegistro).toBe('Registro Interno Nested');
      });

      it('should fallback to Repertorio_Registro', () => {
        const dto = {
          metadata: [
            {
              name: 'Repertorio_Registro',
              value: [{ name: 'TipoRegistro', value: 'Repertorio 123' }],
            },
          ],
        };
        const result = mapDocumentDtoToDetail(dto);
        expect(result.registration!.tipoRegistro).toBe('Repertorio 123');
      });
    });

    describe('Subjects (Soggetti) Mapping', () => {
      it('should parse PF (Persona Fisica) subject', () => {
        const dto = {
          metadata: [
            {
              name: 'Ruolo',
              value: [
                { name: 'TipoRuolo', value: 'Autore' },
                { name: 'PF', value: '' },
                { name: 'Nome', value: 'Mario' },
                { name: 'Cognome', value: 'Rossi' },
                { name: 'CodiceFiscale', value: 'RSSMRA' },
                { name: 'IndirizziDigitaliDiRiferimento', value: 'mario.rossi@pec.it' },
              ],
            },
          ],
        };

        const result = mapDocumentDtoToDetail(dto);
        expect(result.subjects).toHaveLength(1);
        expect(result.subjects![0].tipo).toBe(SubjectType.PF);
        expect(result.subjects![0].ruolo).toBe('Autore');
        expect(result.subjects![0].campiSpecifici['Nome']).toBe('Mario');
        expect(result.subjects![0].campiSpecifici['CodiceFiscale']).toBe('RSSMRA');
        expect(result.subjects![0].campiSpecifici['IndirizziDigitaliDiRiferimento']).toBe(
          'mario.rossi@pec.it',
        );
      });

      it('should parse PG (Persona Giuridica) subject', () => {
        const dto = {
          metadata: [
            {
              name: 'Ruolo',
              value: [
                { name: 'TipoRuolo', value: 'Mittente' },
                { name: 'PG', value: '' },
                { name: 'DenominazioneOrganizzazione', value: 'Azienda SRL' },
                { name: 'CodiceFiscale_PartitaIva', value: 'IT123456789' },
              ],
            },
          ],
        };

        const result = mapDocumentDtoToDetail(dto);
        expect(result.subjects![0].tipo).toBe(SubjectType.PG);
        expect(result.subjects![0].campiSpecifici['DenominazioneOrganizzazione']).toBe(
          'Azienda SRL',
        );
        expect(result.subjects![0].campiSpecifici['CodiceFiscale_PartitaIva']).toBe('IT123456789');
      });

      it('should parse PAI (Pubblica Amministrazione Italiana)', () => {
        const dto = {
          metadata: [
            {
              name: 'Ruolo',
              value: [
                { name: 'TipoRuolo', value: 'Produttore' },
                { name: 'PAI', value: '' },
                { name: 'IPAAmm', value: [{ name: 'CodiceIPA', value: 'IPA-111' }] },
              ],
            },
          ],
        };

        const result = mapDocumentDtoToDetail(dto);
        expect(result.subjects![0].tipo).toBe(SubjectType.PAI);
        expect(result.subjects![0].campiSpecifici['IPAAmm']).toBe('IPA-111');
      });

      it('should parse RUP mapped as Person', () => {
        const dto = {
          metadata: [
            {
              name: 'Ruolo',
              value: [
                { name: 'TipoRuolo', value: 'Responsabile' },
                { name: 'RUP', value: '' },
                { name: 'Nome', value: 'Giulia' },
                { name: 'Cognome', value: 'Bianchi' },
              ],
            },
          ],
        };

        const result = mapDocumentDtoToDetail(dto);
        expect(result.subjects![0].tipo).toBe(SubjectType.PF);
        expect(result.subjects![0].campiSpecifici['Nome']).toBe('Giulia');
      });
    });

    describe('Attachments (Allegati)', () => {
      it('should extract attachment details', () => {
        const dto = {
          metadata: [
            { name: 'NumeroAllegati', value: '1' },
            {
              name: 'IndiceAllegati',
              value: [
                { name: 'Identificativo', value: 'All-01' },
                { name: 'Descrizione', value: 'Planimetria' },
              ],
            },
          ],
        };
        const result = mapDocumentDtoToDetail(dto);
        expect(result.attachments!.numero).toBe(1);
        expect(result.attachments!.allegati).toHaveLength(1);
        expect(result.attachments!.allegati![0].id).toBe('All-01');
        expect(result.attachments!.allegati![0].descrizione).toBe('Planimetria');
      });
    });

    describe('Change Tracking (TracciatureModificheDocumento)', () => {
      it('should extract change tracking details accurately', () => {
        const dto = {
          metadata: [
            { name: 'TipoModifica', value: 'Aggiornamento' },
            {
              name: 'SoggettoAutoreDellaModifica',
              value: [
                { name: 'Nome', value: 'Anna' },
                { name: 'Cognome', value: 'Verdi' },
              ],
            },
            { name: 'DataModifica', value: '2023-10-10' },
            { name: 'IdentificativoVersionePrecedente', value: 'v1.0' },
          ],
        };
        const result = mapDocumentDtoToDetail(dto);
        expect(result.changeTracking!.tipo).toBe('Aggiornamento');
        expect(result.changeTracking!.soggetto).toBe('Anna Verdi');
        expect(result.changeTracking!.data).toBe('2023-10-10');
        expect(result.changeTracking!.idVersionePrecedente).toBe('v1.0');
      });
    });

    describe('Custom Metadata', () => {
      it('should bundle unmapped custom variables outside standard document domain', () => {
        const dto = {
          metadata: [
            { name: 'CustomMetadata', value: [{ name: 'SistemaSorgente', value: 'ExtApp' }] },
            { name: 'FieldNotPresentInXSD', value: '1234' }, // Will be handled by the generic unmapped extractor
          ],
        };
        const result = mapDocumentDtoToDetail(dto);

        expect(result.customMetadata).toEqual(
          expect.arrayContaining([
            { nome: 'SistemaSorgente', valore: 'ExtApp' },
            { nome: 'FieldNotPresentInXSD', valore: '1234' },
          ]),
        );
      });
    });
  });
});
