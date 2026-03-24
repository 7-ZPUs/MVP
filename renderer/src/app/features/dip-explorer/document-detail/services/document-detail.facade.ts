// renderer/src/app/core/facades/document-detail.facade.ts

import { Injectable, signal } from '@angular/core';
import { DocumentDetailDTO } from '../domain/document-detail.model';

@Injectable({ providedIn: 'root' })
export class DocumentDetailFacade {
  // --- STATO (Signals) ---
  document = signal<DocumentDetailDTO | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  // --- AZIONI ---
  async loadDocument(id: string): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      // MOCK: Simula una chiamata di rete o IPC di 1 secondo
      const mockData = await this.mockIpcCall(id);
      this.document.set(mockData);
    } catch (err) {
      this.error.set('Impossibile caricare il documento.');
    } finally {
      this.isLoading.set(false);
    }
  }

  // Funzione fittizia da sostituire in futuro con: window.api.invoke('get-doc', id)
  private mockIpcCall(id: string): Promise<DocumentDetailDTO> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          fileData: '/test.pdf',
          DocumentoInformatico: {
            IdDoc: {
              ImprontaCrittograficaDelDocumento: {
                Impronta: 'ez1qzxYOXioQaQamQGzyOYX5bcI5Amgg1piDE7nu7JA=',
                Algoritmo: 'SHA-256',
              },
              Identificativo: '07af7340-1fbe-4898-9bcb-8a79fee19aa2',
            },
            ModalitaDiFormazione:
              'generazione o raggruppamento anche in via automatica di un insieme di dati o registrazioni, provenienti da una o più banche dati, anche appartenenti a più soggetti interoperanti, secondo una struttura logica predeterminata e memorizzata in forma statica',
            TipologiaDocumentale: 'Registri IVA',
            DatiDiRegistrazione: {
              TipologiaDiFlusso: 'E',
              TipoRegistro: {
                Repertorio_Registro: {
                  TipoRegistro: 'Repertorio\\Registro',
                  DataRegistrazioneDocumento: '2024-08-27',
                  NumeroRegistrazioneDocumento: '123456',
                  CodiceRegistro: 'QAWSEDR13579',
                },
              },
            },
            Soggetti: {
              Ruolo: [
                {
                  SoggettoCheEffettuaLaRegistrazione: {
                    TipoRuolo: 'Soggetto Che Effettua La Registrazione',
                    PF: {
                      Cognome: 'Esposito',
                      Nome: 'Sara',
                      IndirizziDigitaliDiRiferimento: 'esposito.logistica@pec.it',
                    },
                  },
                },
                {
                  Assegnatario: {
                    TipoRuolo: 'Assegnatario',
                    AS: {
                      Cognome: 'Paolotti',
                      Nome: 'Andrea',
                      CodiceFiscale: 'PLTNDR68A01A172X',
                      DenominazioneOrganizzazione: 'Alfa S.p.A',
                      DenominazioneUfficio: 'Ufficio Logistica',
                      IndirizziDigitaliDiRiferimento: 'alfa.logistica@pec.it',
                    },
                  },
                },
                {
                  Mittente: {
                    TipoRuolo: 'Mittente',
                    PG: {
                      DenominazioneOrganizzazione: 'ARK SRL',
                      CodiceFiscale_PartitaIva: '00000000046',
                      DenominazioneUfficio: 'Ufficio Protocollo',
                    },
                  },
                },
                {
                  Destinatario: {
                    TipoRuolo: 'Destinatario',
                    PG: {
                      DenominazioneOrganizzazione: 'Beta S.R.L',
                      CodiceFiscale_PartitaIva: '57706410339',
                      DenominazioneUfficio: 'Ufficio Acquisti',
                    },
                  },
                },
                {
                  Destinatario: {
                    TipoRuolo: 'Destinatario',
                    PG: {
                      DenominazioneOrganizzazione: 'GAMMA S.R.L',
                      CodiceFiscale_PartitaIva: '88877755533',
                      DenominazioneUfficio: 'Ufficio Acquisti',
                    },
                  },
                },
              ],
            },
            ChiaveDescrittiva: {
              Oggetto: 'Prova Oggetto',
              ParoleChiave: ['Prova parola chiave 1', 'Prova parola chiave 2'],
            },
            Allegati: {
              NumeroAllegati: '1',
              IndiceAllegati: {
                IdDoc: {
                  ImprontaCrittograficaDelDocumento: {
                    Impronta: 'gOcLiGqdZFsxPRo/9hyse3i3cis/VW0ZBoCPsGh2Qzs=',
                    Algoritmo: 'SHA-256',
                  },
                  Identificativo: '90a2d432-8bdb-41b4-8164-c9044c2410b6',
                },
                Descrizione: 'Descrizione allegato 1',
              },
            },
            Classificazione: {
              IndiceDiClassificazione: '2A4B6C8D',
              Descrizione: 'Descrizione indice di classificazione',
              PianoDiClassificazione: 'URI del piano di classificazione pubblicato',
            },
            Riservato: 'false',
            IdentificativoDelFormato: {
              Formato: 'PDF',
            },
            Verifica: {
              FirmatoDigitalmente: 'false',
              SigillatoElettronicamente: 'false',
              MarcaturaTemporale: 'false',
              ConformitaCopieImmagineSuSupportoInformatico: 'false',
            },
            Agg: {
              TipoAgg: {
                TipoAggregazione: 'Fascicolo',
                IdAggregazione: '12345',
              },
            },
            NomeDelDocumento: 'FilePrincipaleIPDV_17.pdf',
            VersioneDelDocumento: '1',
            TempoDiConservazione: '10',
            Note: 'Indicazioni aggiuntive utili ad indicare situazioni particolari.',
          },
        });
      }, 1000);
    });
  }
}
