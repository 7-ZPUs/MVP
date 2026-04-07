import { Routes } from '@angular/router';
import { IntegrityDashboardComponent } from './ui/smart/integrity-dashboard/integrity-dashboard.component';
import { INTEGRITY_FACADE_TOKEN } from './contracts/IIntegrityFacade';
import { IntegrityFacade } from './services/integrity.facade';

export const VERIFICATION_ROUTES: Routes = [
  {
    path: '', // Rotta di default per questa feature
    component: IntegrityDashboardComponent,
    providers: [{ provide: INTEGRITY_FACADE_TOKEN, useClass: IntegrityFacade }],
  },
];
