export type TipoMetadato = 'string' | 'number' | 'boolean' | 'date';

export interface Metadato {
    nome: string;
    valore: string;
    tipo: TipoMetadato;
}