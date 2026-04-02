import { Routes } from '@angular/router';
import { SearchPageComponent } from './../../../feature/search/ui/smart/search-page/search-page.component';
import { ItemDetailPageComponent } from '../../../features/item-detail/ui/smart/item-detail-page/item-detail-page.component';

export const appShellRoutes: Routes = [
  {
    path: 'search',
    component: SearchPageComponent,
  },
  {
    path: 'detail',
    redirectTo: 'detail/DOCUMENT/1',
    pathMatch: 'full',
  },
  {
    path: 'detail',
    loadChildren: () =>
      import('./../../../features/item-detail/item-detail.routes').then((m) => m.itemDetailRoutes),
  },
];
