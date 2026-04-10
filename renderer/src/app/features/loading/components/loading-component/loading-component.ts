import { Component, inject } from '@angular/core';
import { LoadingService } from '../../services/loading-service';
import { Observable } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { BootstrapStatus } from '@shared/bootstrap-status';

@Component({
  selector: 'app-loading-component',
  imports: [AsyncPipe],
  templateUrl: './loading-component.html',
  styleUrl: './loading-component.scss',
  standalone: true,
})
export class LoadingComponent {
  private readonly loadingService = inject(LoadingService);
  bootstrapStatus$: Observable<BootstrapStatus> = this.loadingService.bootstrapStatus$;
}
