import { Injectable } from '@angular/core';
import type { ClasseDocumentale } from '../../../electron-api';

/**
 * Servizio Angular per comunicare con il backend Electron
 * tramite l'API esposta dal preload script.
 */
@Injectable({
    providedIn: 'root',
})
export class ClasseDocumentaleApiService {
    private get api() {
        return window.electronAPI.classeDocumentale;
    }

    /**
     * Recupera tutte le classi documentali.
     */
    async findAll(): Promise<ClasseDocumentale[]> {
        return this.api.list();
    }

    /**
     * Recupera una classe documentale per ID.
     */
    async findById(id: number): Promise<ClasseDocumentale | null> {
        return this.api.get(id);
    }

    /**
     * Crea una nuova classe documentale.
     */
    async create(nome: string): Promise<ClasseDocumentale> {
        return this.api.create(nome);
    }
}
