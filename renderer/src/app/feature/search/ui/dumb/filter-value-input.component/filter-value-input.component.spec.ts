import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FilterValueInputComponent } from './filter-value-input.component';
import { FilterFieldType } from '../../../../../../../../shared/metadata/search.enum';

describe('FilterValueInputComponent', () => {
  let component: FilterValueInputComponent;
  let fixture: ComponentFixture<FilterValueInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterValueInputComponent, FormsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterValueInputComponent);
    component = fixture.componentInstance;
  });

  it("dovrebbe emettere valueChanged quando l'input testo cambia", async () => {
    component.definition = {
      key: 'test',
      label: 'Test',
      type: FilterFieldType.TEXT,
      required: false,
    };
    fixture.detectChanges();
    await fixture.whenStable();

    const spy = vi.spyOn(component.valueChanged, 'emit');
    const input = fixture.debugElement.query(By.css('input[type="text"]'));

    input.nativeElement.value = 'ciao';
    input.nativeElement.dispatchEvent(new Event('input'));

    expect(spy).toHaveBeenCalledWith('ciao');
  });

  it("dovrebbe gestire il tipo DATE e stampare l'errore se presente", () => {
    component.definition = {
      key: 'data',
      label: 'Data',
      type: FilterFieldType.DATE,
      required: true,
    };
    component.errors = [{ field: 'data', message: 'Data obbligatoria', code: 'REQ' }];
    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('input[type="date"]'));
    expect(input).toBeTruthy();

    const errorCmp = fixture.debugElement.query(By.css('app-field-error'));
    expect(errorCmp.nativeElement.textContent).toContain('Data obbligatoria');
  });

  it('dovrebbe renderizzare una select se il tipo è SELECT', () => {
    component.definition = {
      key: 'sel',
      label: 'Scegli',
      type: FilterFieldType.ENUM,
      required: false,
      options: [{ label: 'Opzione 1', value: 1 }],
    } as any;
    fixture.detectChanges();

    const select = fixture.debugElement.query(By.css('select'));
    expect(select).toBeTruthy();
    const options = select.queryAll(By.css('option'));
    expect(options.length).toBe(2); // Null + Opzione 1
  });

  it("dovrebbe emettere il valore quando l'input DATE cambia (copertura evento ngModelChange)", async () => {
    component.definition = {
      key: 'data',
      label: 'Data',
      type: FilterFieldType.DATE,
      required: true,
    };
    fixture.detectChanges();
    await fixture.whenStable();

    const spy = vi.spyOn(component.valueChanged, 'emit');
    const input = fixture.debugElement.query(By.css('input[type="date"]'));

    // Scateniamo l'evento di input per coprire la riga (ngModelChange)="onModelChange($event)"
    input.nativeElement.value = '2026-03-26';
    input.nativeElement.dispatchEvent(new Event('input'));

    expect(spy).toHaveBeenCalled();
  });

  it('dovrebbe gestire il tipo NUMBER ed emettere il valore al cambiamento (copertura righe 25-30)', async () => {
    component.definition = {
      key: 'num',
      label: 'Numero',
      type: FilterFieldType.NUMBER,
      required: false,
    };
    fixture.detectChanges();
    await fixture.whenStable();

    const spy = vi.spyOn(component.valueChanged, 'emit');
    const input = fixture.debugElement.query(By.css('input[type="number"]'));
    expect(input).toBeTruthy();

    input.nativeElement.value = '42';
    input.nativeElement.dispatchEvent(new Event('input'));

    expect(spy).toHaveBeenCalled();
  });

  it('dovrebbe gestire il tipo ENUM ed emettere il valore al cambiamento (copertura righe 32-35)', async () => {
    component.definition = {
      key: 'sel',
      label: 'Scegli',
      type: FilterFieldType.ENUM,
      required: false,
      options: [{ label: 'Opzione 1', value: '1' }],
    } as any;
    fixture.detectChanges();
    await fixture.whenStable();

    const spy = vi.spyOn(component.valueChanged, 'emit');
    const select = fixture.debugElement.query(By.css('select'));
    expect(select).toBeTruthy();

    select.nativeElement.value = '1';
    select.nativeElement.dispatchEvent(new Event('change'));

    expect(spy).toHaveBeenCalled();
  });
});
