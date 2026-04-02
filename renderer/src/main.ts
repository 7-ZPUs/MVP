import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppShellComponent } from './app/features/navigation/ui/smart/app-shell.component';
bootstrapApplication(AppShellComponent, appConfig);