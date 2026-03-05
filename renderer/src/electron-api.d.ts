/**
 * Dichiarazioni globali per il renderer Angular.
 *
 * Descrive la forma dell'oggetto `window.electronAPI` esposto dal preload
 * tramite contextBridge. Questo file NON importa da Node o dal core —
 * reitera solo i tipi necessari al renderer.
 */

export interface Persona {
    id: number;
    nome: string;
    cognome: string;
}

interface ElectronPersonaApi {
    list: () => Promise<Persona[]>;
    get: (id: number) => Promise<Persona | null>;
    create: (nome: string, cognome: string) => Promise<Persona>;
    update: (id: number, nome: string, cognome: string) => Promise<Persona | null>;
    delete: (id: number) => Promise<boolean>;
}

interface ElectronApi {
    persona: ElectronPersonaApi;
}

declare global {
    interface Window {
        electronAPI: ElectronApi;
    }
}
