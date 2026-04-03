import { ClasseDocumentaleDto, DipTreeNodeDto, DocumentoDto, ProcessoDto } from './dtos';
import { ClasseDocumentale, DipTreeNode, Documento, Processo } from './models';
import { NodeType } from './enums';
 
export class DipMapper {
 
  /** ClasseDocumentaleDto → DipTreeNode radice (UC-1) */
  static classeToDipTreeNode(dto: ClasseDocumentaleDto): DipTreeNode {
    return new DipTreeNode(
      dto.id,
      NodeType.CLASSE_DOCUMENTALE,
      dto.nome,
      true,
      null,
    );
  }
 
  /** DipTreeNodeDto generico → DipTreeNode (lazy loading UC-2/UC-3) */
  static toDipTreeNode(dto: DipTreeNodeDto): DipTreeNode {
    return new DipTreeNode(
      dto.id,
      dto.type,
      dto.label,
      dto.hasChildren,
      dto.parentId,
    );
  }
 
  static toClasseDocumentale(dto: ClasseDocumentaleDto): ClasseDocumentale {
    return new ClasseDocumentale(dto.id, dto.nome);
  }
 
  static toProcesso(dto: ProcessoDto): Processo {
    return new Processo(dto.id, dto.idProcesso, dto.classeId);
  }
 
  static toDocumento(dto: DocumentoDto): Documento {
    return new Documento(
      dto.id,
      dto.nome,
      dto.formato,
      dto.anteprimaDisponibile,
      dto.processoId,
    );
  }
}