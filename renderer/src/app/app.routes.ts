import { Routes } from '@angular/router';
import { DipExplorerComponent } from './features/navigation/ui/smart/dip-explorer.component';
import { dipReadyGuard } from './features/navigation/guards/dip-ready-guard';

export const routes: Routes = [
    {
        path: 'dip',
        component: DipExplorerComponent,
        canActivate: [dipReadyGuard],
    },

    {
        path: '',
        redirectTo: 'dip',
        pathMatch: 'full',
      },
];