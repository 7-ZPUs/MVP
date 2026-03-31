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

  const createFlatNode = (overrides = {}): FlatNode => ({
    node: mockNode,
    depth: 1,
    hasChildren: true,
    isLoading: false,
    isExpanded: false,
    ...overrides
  });

  const setup = (overrides = {}) => {
    component.flatNode = createFlatNode(overrides);
    fixture.detectChanges();
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

    component.flatNode = createFlatNode();
  });

  it('dovrebbe creare il componente', () => {
    expect(component).toBeTruthy();
  });

  it('dovrebbe mostrare il nome del nodo', () => {
    component.flatNode = createFlatNode();
    fixture.detectChanges()

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain(mockNode.name);
  });

  it('dovrebbe emettere toggle quando clicco il bottone', () => {
    component.flatNode = createFlatNode();
    fixture.detectChanges()
    vi.spyOn(component.toggle, 'emit');
  
    const button = fixture.nativeElement.querySelector('.toggle-icon');
    button.click();
  
    expect(component.toggle.emit).toHaveBeenCalledWith(mockNode.id);
  });

  it('dovrebbe chiamare stopPropagation su toggle', () => {
    const event = new MouseEvent('click');
    const spy = vi.spyOn(event, 'stopPropagation');
  
    component.onToggle(event);
  
    expect(spy).toHaveBeenCalled();
  });

  it('dovrebbe emettere nodeSelected quando clicco il nodo', () => {
    vi.spyOn(component.nodeSelected, 'emit');
  
    const div = fixture.nativeElement.querySelector('div');
    div.click();
  
    expect(component.nodeSelected.emit).toHaveBeenCalledWith(mockNode);
  });

  it('dovrebbe mostrare il bottone toggle se ha figli', () => {
    setup({ hasChildren: true });

    const button = fixture.nativeElement.querySelector('.toggle-icon');
    expect(button).toBeTruthy();
  });

  it('non dovrebbe mostrare il bottone toggle se non ha figli', () => {
    setup({ hasChildren: false });
    
    const button = fixture.nativeElement.querySelector('.toggle-icon');
    expect(button).toBeFalsy();
  });

  it('dovrebbe mostrare spinner quando isLoading è true', () => {
    setup({ isLoading: true });

    const spinner = fixture.nativeElement.querySelector('.spinner');
    expect(spinner).toBeTruthy();
  });
  
  it('non dovrebbe mostrare spinner quando isLoading è false', () => {
    setup({ isLoading: false });
  
    const spinner = fixture.nativeElement.querySelector('.spinner');
    expect(spinner).toBeFalsy();
  });


  /*it('dovrebbe mostrare inline error se childrenError esiste', () => {
    component.flatNode.childrenError = 'Errore!';
    fixture.detectChanges();
  
    const error = fixture.nativeElement.querySelector('app-inline-error');
    expect(error).toBeTruthy();
  });*/
  
  it('non dovrebbe mostrare inline error se non c’è errore', () => {
    setup({ childrenError: undefined });
  
    const error = fixture.nativeElement.querySelector('app-inline-error');
    expect(error).toBeFalsy();
  });

  it('dovrebbe mostrare ▶ quando non è espanso', () => {
    setup({ isExpanded: false });
  
    const button = fixture.nativeElement.querySelector('.toggle-icon');
    expect(button.textContent).toContain('▶');
  });
  
  it('dovrebbe mostrare ▼ quando è espanso', () => {
    setup({ isExpanded: true });
  
    const button = fixture.nativeElement.querySelector('.toggle-icon');
    expect(button.textContent).toContain('▼');
  });
});