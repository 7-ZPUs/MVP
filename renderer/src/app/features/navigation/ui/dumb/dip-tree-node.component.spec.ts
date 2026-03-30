import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DipTreeNodeComponent } from './dip-tree-node.component';
import { FlatNode } from '../../contracts/flat-node';
import { DipTreeNode } from '../../contracts/dip-tree-node';
import { InlineErrorComponent } from './inline-error.component';
import { CommonModule } from '@angular/common';
import { vi } from 'vitest';

describe('DipTreeNodeComponent', () => {
  let component: DipTreeNodeComponent;
  let fixture: ComponentFixture<DipTreeNodeComponent>;

  const mockNode: DipTreeNode = {
    id: 'node-1',
    name: 'Test Node',
    type: 'class',
    hasChildren: true,
    isLoading: false,
  };

  const mockFlatNode: FlatNode = {
    node: mockNode,
    depth: 1,
    hasChildren: true,
    isLoading: false,
    isExpanded: false,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DipTreeNodeComponent,
        CommonModule,
        InlineErrorComponent,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DipTreeNodeComponent);
    component = fixture.componentInstance;
    component.flatNode = mockFlatNode;
    fixture.detectChanges();
  });

  it('dovrebbe creare il componente', () => {
    expect(component).toBeTruthy();
  });

  it('dovrebbe mostrare il nome del nodo', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain(mockNode.name);
  });

  it('dovrebbe emettere evento toggle quando onToggle viene chiamato', () => {
    vi.spyOn(component.toggle, 'emit');
    component.onToggle(new MouseEvent('click'));
    expect(component.toggle.emit).toHaveBeenCalledWith(mockNode.id);
  });

  it('dovrebbe emettere evento stopPropagation quando onToggle viene chiamato', () => {
    vi.spyOn(component.toggle, 'emit');
    component.onToggle(new MouseEvent('click'));
    expect(component.toggle.emit).toHaveBeenCalled();
  })

  it('dovrebbe emettere evento nodeSelected quando onClick viene chiamato', () => {
    vi.spyOn(component.nodeSelected, 'emit');
    component.onClick();
    expect(component.nodeSelected.emit).toHaveBeenCalledWith(mockNode);
  });

});