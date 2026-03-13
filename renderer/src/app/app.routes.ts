import { Routes } from '@angular/router';
import { PersonaComponent } from './features/persona/persona.component';

export const routes: Routes = [
    { path: '', redirectTo: 'persone', pathMatch: 'full' },
    { path: 'persone', component: PersonaComponent },
];
