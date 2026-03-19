import { Routes } from '@angular/router';
import { DocumentDetailPageComponent } from './pages/document-detail-page/document-detail-page.component';

export const DOCUMENT_DETAIL_ROUTES: Routes = [
  {
    // Rotta principale: es. /documento/DOC-12345
    path: ':id',
    component: DocumentDetailPageComponent,
  },
  {
    // Fallback: se qualcuno naviga a /documento senza specificare un ID.
    // Il nostro componente ha già una logica che carica un ID mockato di default.
    path: '',
    component: DocumentDetailPageComponent,
  },
];
