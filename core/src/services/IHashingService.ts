/**
 * IHashingService — Domain Service Interface.
 *
 * Astrae il calcolo crittografico dell'hash. Vive nel layer di dominio
 * perché descrive un'operazione di business (verifica integrità), ma
 * NON conosce l'implementazione concreta (crypto.subtle, Node crypto, …).
 *
 * Regola architetturale: le entità NON chiamano direttamente questa
 * interfaccia — lo fa il Use Case come orchestratore.
 */
export const HASHING_SERVICE_TOKEN = Symbol('IHashingService');

export interface IHashingService {
    /**
     * Calcola l'hash SHA-256 del buffer fornito e lo restituisce
     * come stringa Base64.
     *
     * @param buffer - I byte da firmare crittograficamente.
     * @returns Hash SHA-256 codificato in Base64.
     */
    calcolaHash(buffer: ArrayBuffer): Promise<string>;
}
