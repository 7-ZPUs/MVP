import { Routes } from '@angular/router';
import { SearchPageComponent } from './ui/smart/search-page/search-page.component'; // Aggiusta questo path!

export const routes: Routes = [
  { path: '', redirectTo: 'search', pathMatch: 'full' },
  { path: 'search', component: SearchPageComponent },
];
