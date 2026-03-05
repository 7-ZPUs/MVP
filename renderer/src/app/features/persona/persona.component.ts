/**
 * PersonaComponent — pagina CRUD per l'entità Persona.
 *
 * Didattica: mostra il percorso completo di un'azione utente:
 *
 *   Componente Angular
 *     → PersonaApiService
 *       → window.electronAPI.persona (contextBridge / preload)
 *         → ipcRenderer.invoke(channel)
 *           → ipcMain.handle(channel)  [Main Process]
 *             → PersonaIpcAdapter
 *               → PersonaService (Application)
 *                 → PersonaSqliteRepository (SQLite)
 */
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PersonaApiService } from './persona-api.service';
import type { Persona } from '../../../electron-api';

@Component({
    selector: 'app-persona',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './persona.component.html',
    styleUrl: './persona.component.scss',
})
export class PersonaComponent implements OnInit {
    // -----------------------------------------------------------------------
    // State (Signals)
    // -----------------------------------------------------------------------
    readonly persone = signal<Persona[]>([]);
    readonly loading = signal(false);
    readonly errorMsg = signal<string | null>(null);
    readonly editingId = signal<number | null>(null);

    // Form fields
    nome = '';
    cognome = '';

    constructor(private readonly personaApi: PersonaApiService) { }

    // -----------------------------------------------------------------------
    // Lifecycle
    // -----------------------------------------------------------------------
    async ngOnInit(): Promise<void> {
        await this.load();
    }

    // -----------------------------------------------------------------------
    // CRUD operations
    // -----------------------------------------------------------------------
    async load(): Promise<void> {
        this.loading.set(true);
        this.errorMsg.set(null);
        try {
            this.persone.set(await this.personaApi.list());
        } catch (e) {
            this.errorMsg.set(String(e));
        } finally {
            this.loading.set(false);
        }
    }

    async submit(): Promise<void> {
        this.errorMsg.set(null);
        try {
            if (this.editingId() !== null) {
                await this.personaApi.update(this.editingId()!, this.nome, this.cognome);
                this.cancelEdit();
            } else {
                await this.personaApi.create(this.nome, this.cognome);
            }
            this.nome = '';
            this.cognome = '';
            await this.load();
        } catch (e) {
            this.errorMsg.set(String(e));
        }
    }

    startEdit(p: Persona): void {
        this.editingId.set(p.id);
        this.nome = p.nome;
        this.cognome = p.cognome;
    }

    cancelEdit(): void {
        this.editingId.set(null);
        this.nome = '';
        this.cognome = '';
    }

    async remove(id: number): Promise<void> {
        this.errorMsg.set(null);
        try {
            await this.personaApi.delete(id);
            await this.load();
        } catch (e) {
            this.errorMsg.set(String(e));
        }
    }
}
