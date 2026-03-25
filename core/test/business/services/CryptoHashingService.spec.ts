import { describe, expect, it } from 'vitest';
import { CryptoHashingService } from '../../../src/services/impl/CryptoHashingService';

function toArrayBuffer(value: string): ArrayBuffer {
    const bytes = new TextEncoder().encode(value);
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

describe('CryptoHashingService', () => {
    it('returns deterministic hash for same input', async () => {
        const service = new CryptoHashingService();
        const source = toArrayBuffer('hello-world');

        const first = await service.calcolaHash(source);
        const second = await service.calcolaHash(source);

        expect(first).toBe(second);
        expect(first.length).toBeGreaterThan(0);
    });

    it('returns different hashes for different inputs', async () => {
        const service = new CryptoHashingService();

        const first = await service.calcolaHash(toArrayBuffer('hello'));
        const second = await service.calcolaHash(toArrayBuffer('world'));

        expect(first).not.toBe(second);
    });

    it('hashes empty buffer without throwing', async () => {
        const service = new CryptoHashingService();

        const hash = await service.calcolaHash(new ArrayBuffer(0));

        expect(hash.length).toBeGreaterThan(0);
    });
});
