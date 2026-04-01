import { Routes } from '@angular/router';
import { SearchPageComponent } from './feature/search/ui/smart/search-page/search-page.component';

export const routes: Routes = [
  { path: '', redirectTo: 'search', pathMatch: 'full' },
  { path: 'search', component: SearchPageComponent },
];
