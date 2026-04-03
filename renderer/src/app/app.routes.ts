import { Routes } from '@angular/router';
import { AppShellComponent } from './shared/components/app-shell/app-shell.component';
import { DipExplorerComponent } from './features/navigation/ui/smart/dip-explorer.component';
//import { dipReadyGuard } from './features/navigation/guards/dip-ready-guard';

export const routes: Routes = [
  {
    path: 'dip',
    component: DipExplorerComponent,
  },

  //TODO aggiungere le altre rotte

  {
    path: '',
    redirectTo: 'dip',
    pathMatch: 'full',
  },
  {
    path: '',
    component: AppShellComponent,
    children: [
      {
        path: 'search',
        loadChildren: () => import('./feature/search/app.search.routes').then((m) => m.routes),
      },
      {
        path: 'detail',
        loadChildren: () =>
          import('./features/item-detail/item-detail.routes').then((m) => m.itemDetailRoutes),
      },
    ],
  },
];
