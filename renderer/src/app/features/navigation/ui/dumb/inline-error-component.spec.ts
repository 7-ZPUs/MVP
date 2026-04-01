import { ComponentFixture, TestBed } from "@angular/core/testing";
import { InlineErrorComponent } from "./inline-error.component";
import { vi } from 'vitest';
import { CommonModule } from "@angular/common";
import { AppError } from "../../contracts/app-error";
import { By } from "@angular/platform-browser";

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

    it('mostra il messaggio di errore', () => {
        component.error = { message: 'Errore test', code: 'TEST_ERROR', recoverable: false } as AppError;
        fixture.detectChanges();

        const el = fixture.nativeElement;
        expect(el.textContent).toContain('Errore test');
    });

    it('mostra il pulsante retry se recoverable=true', () => {
        component.error = { message: 'Errore retry', code: 'TEST_RETRY', recoverable: true } as AppError;
        fixture.detectChanges();

        const button = fixture.debugElement.query(By.css('button'));
        expect(button).toBeTruthy();
        expect(button.nativeElement.textContent).toContain('Riprova');
    });

    it('non mostra il pulsante retry se recoverable=false', () => {
        component.error = { message: 'Errore non recoverable', code: 'TEST_NO_RETRY', recoverable: false } as AppError;
        fixture.detectChanges();

        const button = fixture.debugElement.query(By.css('button'));
        expect(button).toBeNull();
    });

    it('emette retry quando si clicca il pulsante', () => {
        const spy = vi.spyOn(component.retry, 'emit');
        component.error = { message: 'Errore retry', code: 'TEST_RETRY', recoverable: true } as AppError;
        fixture.detectChanges();

        const button = fixture.debugElement.query(By.css('button'));
        button.nativeElement.click();

        expect(spy).toHaveBeenCalled();
    });
})