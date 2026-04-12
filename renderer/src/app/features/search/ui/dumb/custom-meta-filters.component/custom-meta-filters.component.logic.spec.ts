import '@angular/compiler';
import { describe, it, expect, vi } from 'vitest';
import { FormBuilder } from '@angular/forms';
import { SimpleChange } from '@angular/core';
import { CustomMetaFiltersComponent } from './custom-meta-filters.component';

describe('CustomMetaFiltersComponent logic', () => {
  const buildComponent = () => new CustomMetaFiltersComponent(new FormBuilder());

  it('does not rebuild controls when incoming filters are equivalent', () => {
    const component = buildComponent();

    component.ngOnChanges({
      filters: new SimpleChange(null, [{ field: 'MetaKey', value: 'MetaValue' }], true),
    });

    const original = component.entries.at(0);

    component.ngOnChanges({
      filters: new SimpleChange(
        [{ field: 'MetaKey', value: 'MetaValue' }],
        [{ field: 'MetaKey', value: 'MetaValue' }],
        false,
      ),
    });

    expect(component.entries.at(0)).toBe(original);
  });

  it('rebuilds controls when incoming filters change', () => {
    const component = buildComponent();

    component.ngOnChanges({
      filters: new SimpleChange(null, [{ field: 'MetaKey', value: 'MetaValue' }], true),
    });

    const original = component.entries.at(0);

    component.ngOnChanges({
      filters: new SimpleChange(
        [{ field: 'MetaKey', value: 'MetaValue' }],
        [{ field: 'MetaKey2', value: 'MetaValue2' }],
        false,
      ),
    });

    expect(component.entries.at(0)).not.toBe(original);
    expect(component.entries.at(0).value).toEqual({ field: 'MetaKey2', value: 'MetaValue2' });
  });

  it('keeps local blank draft rows when parent echoes only meaningful entries', () => {
    const component = buildComponent();

    component.ngOnChanges({
      filters: new SimpleChange(null, [{ field: 'MetaKey', value: 'MetaValue' }], true),
    });

    component.addEntry(undefined, false);
    expect(component.entries.length).toBe(2);

    const draftControl = component.entries.at(1);

    component.ngOnChanges({
      filters: new SimpleChange(
        [{ field: 'MetaKey', value: 'MetaValue' }],
        [{ field: 'MetaKey', value: 'MetaValue' }],
        false,
      ),
    });

    expect(component.entries.length).toBe(2);
    expect(component.entries.at(1)).toBe(draftControl);
  });

  it('emits filtered values while typing and null when entries are blank', () => {
    const component = buildComponent();
    const emitSpy = vi.spyOn(component.filtersChanged, 'emit');

    component.addEntry(undefined, false);
    component.entries.at(0).patchValue({ field: 'Cliente', value: '' });

    expect(emitSpy).toHaveBeenCalledWith([{ field: 'Cliente', value: '' }]);

    component.entries.at(0).patchValue({ field: '', value: '' });

    expect(emitSpy).toHaveBeenCalledWith(null);
  });
});
