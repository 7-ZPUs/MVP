/**
 * Dichiarazioni globali per il renderer Angular.
 *
 * Descrive la forma dell'oggetto `window.electronAPI` esposto dal preload
 * tramite contextBridge. Questo file NON importa da Node o dal core —
 * reitera solo i tipi necessari al renderer.
 */

export interface ClasseDocumentale {
    id: number;
    nome: string;
}

interface ElectronClasseDocumentaleApi {
    list: () => Promise<ClasseDocumentale[]>;
    get: (id: number) => Promise<ClasseDocumentale | null>;
    create: (nome: string) => Promise<ClasseDocumentale>;
}

interface ElectronApi {
    classeDocumentale: ElectronClasseDocumentaleApi;
}

declare global {
    interface Window {
        electronAPI: ElectronApi;
    }
}
