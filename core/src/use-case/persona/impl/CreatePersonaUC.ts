/**
 * PersonaCrudUseCase — Application Service
 *
 * Implementa il caso d'uso IPersonaUseCase.
 * Conosce SOLO il contratto IPersonaRepository (tramite token DI) —
 * mai la classe SQLite concreta.
 *
 * Flusso:
 *   IPC Adapter → IPersonaUseCase (questo servizio) → IPersonaRepository (SQLite adapter)
 */
import { injectable, inject } from 'tsyringe';
import type { Persona } from '../../../entity/Persona';
import { PERSONA_REPOSITORY_TOKEN } from '../../../repo/PersonaRepository';
import type { IPersonaRepository } from '../../../repo/PersonaRepository';
import type { ICreatePersonaUC } from '../ICreatePersonaUC';

@injectable()
export class CreatePersonaUC implements ICreatePersonaUC {
    constructor(
        @inject(PERSONA_REPOSITORY_TOKEN)
        private readonly repo: IPersonaRepository,
    ) { }

    create(nome: string, cognome: string): Persona {
        if (!nome.trim() || !cognome.trim()) {
            throw new Error('Nome e cognome non possono essere vuoti.');
        }
        return this.repo.create(nome.trim(), cognome.trim());
    }
}
