import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/integrity-dashboard',
    pathMatch: 'full',
  },
  {
    path: 'integrity-dashboard',
    loadChildren: () =>
      import('./features/verification/verification.routes').then((m) => m.VERIFICATION_ROUTES),
  },
];
