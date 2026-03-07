import { injectable } from 'tsyringe';
import type { IHashingService } from '../IHashingService';

/**
 * CryptoHashingService — Infrastructure implementation of IHashingService.
 *
 * Usa Web Crypto API (crypto.subtle), disponibile sia in Electron/Node ≥ 15
 * che nel browser. È l'unico punto del codebase che tocca crypto.subtle:
 * staccarlo qui permette di sostituirlo o mockarlo nei test senza cambiare
 * nulla nel dominio o negli use case.
 */
@injectable()
export class CryptoHashingService implements IHashingService {
    async calcolaHash(buffer: ArrayBuffer): Promise<string> {
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));

        // Converte il byte array in stringa binaria, poi in Base64.
        // L'approccio con ciclo for è più robusto dello spread operator
        // su array di grandi dimensioni.
        let binaryString = '';
        for (let i = 0; i < hashArray.length; i++) {
            binaryString += String.fromCharCode(hashArray[i]);
        }

        return btoa(binaryString);
    }
}
