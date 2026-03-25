import { Routes } from '@angular/router';
import { IntegrityDashboardComponent } from './features/verification/ui/smart/integrity-dashboard/integrity-dashboard.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/integrity-dashboard',
    pathMatch: 'full',
  },
  {
    path: 'integrity-dashboard',
    component: IntegrityDashboardComponent,
  },
];
