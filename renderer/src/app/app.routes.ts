import { Routes } from '@angular/router';
import { AppShellComponent } from './shared/components/app-shell/app-shell.component';

export const routes: Routes = [
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
