import { CommonModule } from "@angular/common";
import { Component, Input } from "@angular/core";
import { AppError } from "../../contracts/app-error";


@Component ({
    selector: 'app-async-state-wrapper',
    standalone: true,
    templateUrl: './async-state-wrapper.html',
    imports: [CommonModule]
})

export class AsyncStateWrapperComponent {
    @Input() loading!: boolean;
    @Input() error!: AppError | null;
}