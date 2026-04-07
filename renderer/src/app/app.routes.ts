import { Routes } from '@angular/router';
import { AppShellComponent as NavigationShellComponent } from './features/navigation/ui/smart/app-shell.component';
import { NavigationHomeComponent } from './features/navigation/ui/dumb/navigation-home.component';

export const routes: Routes = [
  {
    path: '',
    component: NavigationShellComponent,
    children: [
      {
        path: '',
        redirectTo: 'browse',
        pathMatch: 'full',
      },
      {
        path: 'browse',
        component: NavigationHomeComponent,
      },
      {
        path: 'search',
        loadChildren: () => import('./feature/search/app.search.routes').then((m) => m.routes),
      },
      {
        path: 'detail',
        loadChildren: () =>
          import('./features/item-detail/item-detail.routes').then((m) => m.itemDetailRoutes),
      },
      {
        path: 'integrity-dashboard',
        loadChildren: () =>
          import('./features/verification/verification.routes').then((m) => m.VERIFICATION_ROUTES),
      },
    ],
  },
  {
    path: 'dip',
    redirectTo: 'browse',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'browse',
  },
];
