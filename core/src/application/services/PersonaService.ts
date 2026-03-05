/**
 * PersonaService — Application Service
 *
 * Implementa il caso d'uso IPersonaUseCase.
 * Conosce SOLO il contratto IPersonaRepository (tramite token DI) —
 * mai la classe SQLite concreta.
 *
 * Flusso:
 *   IPC Adapter → IPersonaUseCase (questo servizio) → IPersonaRepository (SQLite adapter)
 */
import { injectable, inject } from 'tsyringe';
import type { Persona } from '../../domain/entities/Persona';
import { PERSONA_REPOSITORY_TOKEN } from '../../domain/ports/outbound/IPersonaRepository';
import type { IPersonaRepository } from '../../domain/ports/outbound/IPersonaRepository';
import type { IPersonaUseCase } from '../../domain/ports/inbound/IPersonaUseCase';

@injectable()
export class PersonaService implements IPersonaUseCase {
    constructor(
        @inject(PERSONA_REPOSITORY_TOKEN)
        private readonly repo: IPersonaRepository,
    ) { }

    listAll(): Persona[] {
        return this.repo.findAll();
    }

    getById(id: number): Persona | undefined {
        return this.repo.findById(id);
    }

    create(nome: string, cognome: string): Persona {
        if (!nome.trim() || !cognome.trim()) {
            throw new Error('Nome e cognome non possono essere vuoti.');
        }
        return this.repo.create(nome.trim(), cognome.trim());
    }

    update(id: number, nome: string, cognome: string): Persona | undefined {
        if (!nome.trim() || !cognome.trim()) {
            throw new Error('Nome e cognome non possono essere vuoti.');
        }
        return this.repo.update(id, nome.trim(), cognome.trim());
    }

    delete(id: number): boolean {
        return this.repo.delete(id);
    }
}
