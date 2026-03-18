// un vettore è un array di numeri con una dimensione specifica. Non ha metodi 
// da quello che so, quindi credo vada bene un value object.
export class Vector {
    constructor(public readonly values: number[]) {}

    get dimensions(): number {
        return this.values.length;
    }
}