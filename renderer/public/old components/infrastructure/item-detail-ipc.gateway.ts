/*import { Injectable } from '@angular/core';
import { IpcChannels } from '../../../../../../../shared/ipc-channels';
import { AggregateDetailDTO, DocumentDTO, FileDTO } from '../../../../shared/domain/dto/indexDTO';

@Injectable({ providedIn: 'root' })
export class DocumentDetailIpcGateway {
  private async invokeOrMock<T>(channel: string, mockFactory: () => T, ...args: any[]): Promise<T> {
    const electronApi = (window as any).api;
    if (electronApi && typeof electronApi.invoke === 'function') {
      return electronApi.invoke(channel, ...args);
    }

    console.warn(`[IPC Mock] Simulazione canale ${channel} per ID:`, args[0]);
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockFactory()), 400); // Abbassato a 400ms per test più rapidi
    });
  }

  // ==========================================================
  // MOCK DOCUMENTI
  // ==========================================================
  async getDocumentById(documentId: number): Promise<DocumentDTO> {
    return this.invokeOrMock(
      IpcChannels.BROWSE_GET_DOCUMENT_BY_ID,
      () => {
        // CASO: Documento "Povero" (Senza metadati complessi)
        if (documentId === 2) {
          return {
            id: 2,
            processId: 1,
            uuid: `DOC-POVERO-2`,
            integrityStatus: 'UNKNOWN',
            metadata: [
              { name: 'Note', type: 'String', value: 'Questo documento ha pochissimi dati.' },
            ],
          } as any;
        }

        // CASO STANDARD (Documento 1)
        return {
          id: documentId,
          processId: 1,
          uuid: `DOC-MOCK-${documentId}`,
          integrityStatus: 'VALID',
          metadata: [
            { name: 'TipologiaDocumentale', type: 'String', value: 'Registri IVA' },
            { name: 'Riservato', type: 'Boolean', value: 'false' },
            {
              name: 'Soggetti',
              type: 'Object',
              value: JSON.stringify([
                {
                  name: 'Mittente',
                  type: 'PersonaGiuridica',
                  value: JSON.stringify([
                    { name: 'Denominazione', type: 'String', value: 'ARK SRL' },
                    { name: 'PartitaIva', type: 'String', value: '00000000046' },
                  ]),
                },
              ]),
            },
          ],
        } as any;
      },
      documentId,
    );
  }

  async getFilesByDocument(documentId: number): Promise<FileDTO[]> {
    return this.invokeOrMock(
      IpcChannels.BROWSE_GET_FILE_BY_DOCUMENT,
      () => {
        // CASO: Documento senza file fisico associato (es. ID 2)
        if (documentId === 2) {
          return [] as any;
        }

        // CASO STANDARD (Il tuo test.pdf in public)
        return [
          {
            id: 99,
            documentId: documentId,
            filename: 'test.pdf',
            path: '/test.pdf',
            hash: 'abc',
            integrityStatus: 'VALID',
            isMain: true,
          },
        ] as any;
      },
      documentId,
    );
  }

  // ==========================================================
  // MOCK AGGREGAZIONI (FASCICOLI)
  // ==========================================================
  async getAggregateById(aggregateId: string): Promise<AggregateDetailDTO> {
    return this.invokeOrMock(
      'browse:get-aggregate-by-id',
      () => {
        const fascicoloConformeXSD: AggregateDetailDTO = {
          idAgg: {
            tipoAggregazione: 'Fascicolo', // [cite: 17]
            idAggregazione: aggregateId, // [cite: 16]
          },
          tipologiaFascicolo: 'procedimento amministrativo', // [cite: 18]
          soggetti: [
            // [cite: 14]
            {
              tipoRuolo: 'Amministrazione Titolare',
              denominazione: 'Comune di Roma',
              indirizzoDigitale: 'protocollo@pec.comune.roma.it',
            },
            { tipoRuolo: 'RUP', denominazione: 'Mario Rossi', codiceFiscale: 'RSSMRA80A01H501Z' },
          ],
          dataApertura: '2023-10-01', // [cite: 14]
          classificazione: {
            // [cite: 15]
            indiceDiClassificazione: 'Titolo I - Classe 2', // [cite: 34]
            descrizione: 'Risorse Umane e Personale', // [cite: 34]
          },
          progressivo: 145, // [cite: 15, 35]
          chiaveDescrittiva: {
            // [cite: 15]
            oggetto: 'Assunzione nuovo personale IT anno 2023', // [cite: 35]
            paroleChiave: 'Assunzione, IT, Concorso', // [cite: 35, 36]
          },
          procedimentoAmministrativo: {
            // [cite: 15]
            materiaArgomentoStruttura: 'Personale', // [cite: 36]
            procedimento: 'Bando di Concorso Pubblico', // [cite: 36]
            fasi: [
              // [cite: 36]
              { tipoFase: 'Preparatoria', dataInizio: '2023-09-15' },
              { tipoFase: 'Istruttoria', dataInizio: '2023-10-02' },
            ],
          },
          posizioneFisicaAggregazioneDocumentale: 'Archivio Centrale, Stanza 4, Scaffale B', // [cite: 15]
          tempoDiConservazione: 99, // [cite: 16]

          // I documenti andranno nella tabella a destra
          indiceDocumenti: [
            // [cite: 15]
            { tipoDocumento: 'DocumentoAmministativoinformatico', identificativo: '1' }, // [cite: 42, 43]
            { tipoDocumento: 'Documentoinformatico', identificativo: '2' }, // [cite: 42, 43]
          ],
        };

        return fascicoloConformeXSD;
      },
      aggregateId,
    );
  }
}
*/
