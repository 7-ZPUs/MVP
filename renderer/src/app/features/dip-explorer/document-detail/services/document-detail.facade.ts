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
          id: id,
          titolo: `Fascicolo_Personale_${id}.pdf`,
          formato: 'application/pdf',
          fileData: null,
          metadata: {
            tipoDocumento: 'DOCUMENTO AMMINISTRATIVO INFORMATICO',
            chiaveDescrittiva: {
              oggetto: 'Assunzione dipendente',
              paroleChiave: 'HR, Assunzione, Contratto',
            },
            datiRegistrazione: {
              tipologiaFlusso: 'ENTRATA',
              dataRegistrazione: '2026-03-18',
              numeroRegistrazione: 12345,
            },
            conservazione: {
              perenne: true,
              valore: 9999,
            },
          },
        });
      }, 1000);
    });
  }
}
