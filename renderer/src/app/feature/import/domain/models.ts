import { NodeType } from './enums';
 
/** UC-1.1.1 */
export class ClasseDocumentale {
  constructor(
    public readonly id:   string,
    public readonly nome: string,
  ) {}
  getNome(): string { return this.nome; }
}
 
/** UC-2.1.1 */
export class Processo {
  constructor(
    public readonly id:         string,
    public readonly idProcesso: string,
    public readonly classeId:   string,
  ) {}
  getIdProcesso(): string { return this.idProcesso; }
}
 
/** Nodo generico albero DIP — UC-1/2/3 */
export class DipTreeNode {
  public children: DipTreeNode[] = [];
 
  constructor(
    public readonly id:          string,
    public readonly type:        NodeType,
    public readonly label:       string,
    public readonly hasChildren: boolean,
    public readonly parentId:    string | null = null,
  ) {}
 
  isLeaf(): boolean { return !this.hasChildren; }
}
 
/** UC-3.1.1 | UC-7 | UC-8 — specializza DipTreeNode */
export class Documento extends DipTreeNode {
  constructor(
    id:                                    string,
    public readonly nome:                  string,
    public readonly formato:               string,
    public readonly anteprimaDisponibile:  boolean,
    public readonly processoId:            string,
  ) {
    super(id, NodeType.DOCUMENTO, nome, false, processoId);
  }
  getNome(): string                 { return this.nome; }
  isAnteprimaDisponibile(): boolean { return this.anteprimaDisponibile; }
}
 
/** Flat per Angular CDK FlatTreeControl */
export interface FlatNode {
  id:         string;
  label:      string;
  level:      number;
  expandable: boolean;
  type:       NodeType;
}