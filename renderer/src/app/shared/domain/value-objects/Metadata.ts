import { MetadataDTO } from "../dto/MetadataDTO";

export type MetadataType = 'string' | 'number' | 'boolean';

export class Metadata {
    constructor(
        public readonly name: string,
        public readonly value: string,
        public readonly type: MetadataType = 'string'
    ) { }

    /**
     * Serializza in un plain object trasferibile via IPC.
     * Da chiamare SOLO nell'IPC adapter.
     */
    public toDTO(): MetadataDTO {
        return {
            name: this.name,
            value: this.value,
            type: this.type,
        };
    }
}