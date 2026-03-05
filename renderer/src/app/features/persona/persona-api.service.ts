/**
 * PersonaApiService — Angular Service
 *
 * Incapsula tutte le chiamate IPC verso il Main Process per l'entità Persona.
 * I componenti Angular conoscono SOLO questo servizio, mai `window.electronAPI`.
 *
 * È l'equivalente Angular di un "repository client": isola il meccanismo di
 * trasporto (IPC) dalla logica del componente.
 */
import { Injectable } from '@angular/core';
import type { Persona } from '../../../electron-api';

@Injectable({ providedIn: 'root' })
export class PersonaApiService {
    private get api() {
        return window.electronAPI.persona;
    }

    list(): Promise<Persona[]> {
        return this.api.list();
    }

    get(id: number): Promise<Persona | null> {
        return this.api.get(id);
    }

    create(nome: string, cognome: string): Promise<Persona> {
        return this.api.create(nome, cognome);
    }

    update(id: number, nome: string, cognome: string): Promise<Persona | null> {
        return this.api.update(id, nome, cognome);
    }

    delete(id: number): Promise<boolean> {
        return this.api.delete(id);
    }
}
