import { Injectable, signal } from '@angular/core';
import { IIntegrityFacade } from '../../../shared/interfaces/integrity.interfaces';

@Injectable({
  providedIn: 'root',
})
export class IntegrityFacade implements IIntegrityFacade {
  private verifyingSignal = signal<boolean>(false);
  public isVerifying = this.verifyingSignal.asReadonly();

  async verifyDocument(documentId: string): Promise<void> {
    this.verifyingSignal.set(true);
    try {
      // Simulazione verifica per ora
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log(`Document ${documentId} verified successfully.`);
    } finally {
      this.verifyingSignal.set(false);
    }
  }
}
