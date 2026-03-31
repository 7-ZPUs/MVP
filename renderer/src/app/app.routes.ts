import { Routes } from '@angular/router';
import { SearchPageComponent } from './feature/search/ui/smart/search-page/search-page.component';

export const routes: Routes = [
  { path: '', redirectTo: 'search', pathMatch: 'full' },
  { path: 'search', component: SearchPageComponent },
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
