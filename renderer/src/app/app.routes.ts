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
      import('./features/dip-explorer/document-detail/item-detail.routes').then(
        (m) => m.ITEM_DETAIL_ROUTES,
      ),
  },
  {
    path: '**',
    redirectTo: 'detail/DOCUMENT/1',
  },
];
