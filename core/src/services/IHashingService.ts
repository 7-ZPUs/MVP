export const HASHING_SERVICE_TOKEN = Symbol('IHashingService');

export interface IHashingService {
    calcolaHash(buffer: ArrayBuffer): Promise<string>;
}
