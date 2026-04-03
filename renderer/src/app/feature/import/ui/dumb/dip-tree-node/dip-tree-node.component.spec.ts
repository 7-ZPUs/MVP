import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DipTreeNodeComponent } from './dip-tree-node.component';
import { NodeType } from '../../../domain/enums';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { By } from '@angular/platform-browser';

describe('DipTreeNodeComponent', () => {
  let component: DipTreeNodeComponent;
  let fixture: ComponentFixture<DipTreeNodeComponent>;

  const mockNode = {
    id: 'node-1',
    label: 'Cartella Test',
    type: NodeType.CLASSE_DOCUMENTALE,
    hasChildren: true
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DipTreeNodeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DipTreeNodeComponent);
    component = fixture.componentInstance;
    component.node = mockNode as any;
  });

  it('dovrebbe emettere toggle quando si clicca sul bottone freccia', () => {
    const spy = vi.spyOn(component.toggle, 'emit');
    fixture.detectChanges();

    const toggleBtn = fixture.debugElement.query(By.css('.toggle-btn'));
    toggleBtn.triggerEventHandler('click', { stopPropagation: () => {} });

    expect(spy).toHaveBeenCalledWith('node-1');
  });

  it('dovrebbe emettere nodeSelected quando si clicca sull\'intero nodo', () => {
    const spy = vi.spyOn(component.nodeSelected, 'emit');
    fixture.detectChanges();

    const nodeDiv = fixture.debugElement.query(By.css('.tree-node'));
    nodeDiv.triggerEventHandler('click', null);

    expect(spy).toHaveBeenCalledWith(mockNode);
  });

  it('dovrebbe mostrare l\'icona corretta per il tipo DOCUMENTO', () => {
    component.node = { ...mockNode, type: NodeType.DOCUMENTO, hasChildren: false } as any;
    fixture.detectChanges();

    const icon = fixture.debugElement.query(By.css('.node-icon')).nativeElement;
    expect(icon.textContent).toContain('📄');
  });

  it('dovrebbe mostrare lo spinner se isLoading è true', () => {
    component.isLoading = true;
    fixture.detectChanges();

    const spinner = fixture.debugElement.query(By.css('.spinner'));
    expect(spinner).not.toBeNull();
  });
});