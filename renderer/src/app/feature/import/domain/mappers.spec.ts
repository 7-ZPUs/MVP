import { DipMapper } from './mappers';
import { NodeType } from './enums';
import { describe, it, expect } from 'vitest';

describe('DipMapper', () => {

  it('classeToDipTreeNode dovrebbe mappare correttamente una Classe Documentale', () => {
    const dto = { id: 'CL-1', nome: 'Classe Test' };
    const result = DipMapper.classeToDipTreeNode(dto);

    expect(result.id).toBe('CL-1');
    expect(result.label).toBe('Classe Test');
    expect(result.type).toBe(NodeType.CLASSE_DOCUMENTALE);
    expect(result.hasChildren).toBe(true); // Verifichiamo il valore forzato
  });

  it('toDipTreeNode dovrebbe mappare un DTO generico mantenendo i dati', () => {
    const dto = { 
      id: 'NODE-1', 
      type: NodeType.PROCESSO, 
      label: 'Processo A', 
      hasChildren: false, 
      parentId: 'PARENT-1' 
    };
    
    const result = DipMapper.toDipTreeNode(dto);

    expect(result.id).toBe('NODE-1');
    expect(result.type).toBe(NodeType.PROCESSO);
    expect(result.hasChildren).toBe(false);
    expect(result.parentId).toBe('PARENT-1');
  });

  it('toDocumento dovrebbe creare un oggetto Documento con tutti i campi', () => {
    const dto = {
      id: 'DOC-1',
      nome: 'manuale.pdf',
      formato: 'pdf',
      anteprimaDisponibile: true,
      processoId: 'PROC-1'
    };

    const result = DipMapper.toDocumento(dto);

    expect(result.id).toBe('DOC-1');
    expect(result.label).toBe('manuale.pdf');
    expect(result.formato).toBe('pdf');
    expect(result.isAnteprimaDisponibile()).toBe(true);
  });
});