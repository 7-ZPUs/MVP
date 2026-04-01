import { Routes } from '@angular/router';
import { SearchPageComponent } from './feature/search/ui/smart/search-page/search-page.component';

import { DipLoadingPageComponent } from './feature/import/ui/smart/dip-loading-page.component';
import { ExportPageComponent } from './feature/export-manager/ui/smart/export-page.component';

export const routes: Routes = [
  { path: '', redirectTo: 'import', pathMatch: 'full' },
  { path: 'search', component: SearchPageComponent },
  { path: 'import', component: DipLoadingPageComponent },
  { path: 'export', component: ExportPageComponent },
];