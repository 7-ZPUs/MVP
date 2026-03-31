import { Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
    selector: 'app-empty-state',
    standalone: true,
    templateUrl: './empty-state.html',
    imports: [CommonModule],
})

export class EmptyStateComponent {
    @Input() message!: string;
    @Input() icon?: string;
}