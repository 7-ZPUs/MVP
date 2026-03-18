// metodo classico per le ricerche con filtri ( Oppure si usa un oggetto come diceva Antonio )
export class SearchFilter {
    constructor(
        public readonly field: string,
        public readonly value: string | number
    ) {}
}