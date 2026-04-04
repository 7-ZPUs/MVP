import { Component } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-app-shell',
  templateUrl: './app-shell.component.html',
  styleUrls: ['./app-shell.component.scss'],
  imports: [RouterLink, RouterOutlet],
})
export class AppShellComponent {
  constructor(private router: Router) {}
}
