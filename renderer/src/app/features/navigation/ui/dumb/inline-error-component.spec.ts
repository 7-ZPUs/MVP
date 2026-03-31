import { ComponentFixture, TestBed } from "@angular/core/testing";
import { InlineErrorComponent } from "./inline-error.component";
import { vi } from 'vitest';
import { CommonModule } from "@angular/common";

describe('InlineErrorComponent', () => {
    let component: InlineErrorComponent;
    let fixture: ComponentFixture<InlineErrorComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                CommonModule,
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(InlineErrorComponent);
        component = fixture.componentInstance;
    })

    it('dovrebbe creare il componente', () => {
        expect(component).toBeTruthy();
    });
})