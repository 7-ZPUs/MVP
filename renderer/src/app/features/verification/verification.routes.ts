import { Routes } from '@angular/router';
import { IntegrityDashboardComponent } from './ui/smart/integrity-dashboard/integrity-dashboard.component';

export const VERIFICATION_ROUTES: Routes = [
  {
    path: '', // Rotta di default per questa feature
    component: IntegrityDashboardComponent,
  },
];
