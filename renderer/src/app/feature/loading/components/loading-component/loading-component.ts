import { Component, inject } from '@angular/core';
import { LoadingService } from '../../services/loading-service';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-loading-component',
  imports: [AsyncPipe],
  templateUrl: './loading-component.html',
  styleUrl: './loading-component.scss',
  standalone: true,
})
export class LoadingComponent {
  // Usiamo un Observable per gestire lo stato in modo reattivo
  // Il simbolo '$' alla fine è una convenzione per indicare un Observable
  private readonly loadingService = inject(LoadingService);
  isLoaded$: Observable<boolean> = this.loadingService.loadingStatus$;
}
