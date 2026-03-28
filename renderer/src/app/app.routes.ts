import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'detail/DOCUMENT/1',
    pathMatch: 'full',
  },
  {
    path: 'detail',
    redirectTo: 'detail/DOCUMENT/1',
    pathMatch: 'full',
  },
  {
    path: 'detail',
    loadChildren: () =>
      import('./features/item-detail/item-detail.routes').then((m) => m.itemDetailRoutes),
  },
  {
    path: '**',
    redirectTo: 'detail/DOCUMENT/1',
  },
];
