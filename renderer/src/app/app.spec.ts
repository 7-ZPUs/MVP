import { TestBed } from '@angular/core/testing';
import { App } from './app';

it('should render title', async () => {
  const fixture = TestBed.createComponent(App);
  fixture.detectChanges();

  await fixture.whenStable();

  const compiled = fixture.nativeElement as HTMLElement;

  const h1 = compiled.querySelector('h1');

  expect(h1).not.toBeNull();

  const text = h1?.textContent?.trim() ?? '';

  expect(text.length).toBeGreaterThan(0);
});
