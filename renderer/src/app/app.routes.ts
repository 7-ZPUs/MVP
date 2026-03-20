import { Routes } from '@angular/router';
import { DocumentDetailPageComponent } from './features/dip-explorer/document-detail/ui/smart/document-detail-page/document-detail-page.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'document/demo',
  },
  {
    path: 'document/:id',
    component: DocumentDetailPageComponent,
  },
];
