import { injectable } from 'tsyringe';
import type { IHashingService } from '../IHashingService';

@injectable()
export class CryptoHashingService implements IHashingService {
    async calcolaHash(buffer: ArrayBuffer): Promise<string> {
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));

        let binaryString = '';
        for (let i = 0; i < hashArray.length; i++) {
            binaryString += String.fromCharCode(hashArray[i]);
        }

        return btoa(binaryString);
    }
}
