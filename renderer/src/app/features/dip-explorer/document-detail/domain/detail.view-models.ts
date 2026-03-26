export interface MetadataNodeVM {
  name: string;
  type: string;
  value?: string;
  children?: MetadataNodeVM[];
}

// Interfaccia dedotta dal tuo diagramma C4 per l'indice dei documenti
export interface DocumentIndexEntryVM {
  tipo: string;
  identificativo: string;
  titolo?: string; // Utile per la UI
}

export type ItemDetailType = 'DOCUMENT' | 'AGGREGATE';

export interface ItemDetailVM {
  id: string; // Nel diagramma C4 aggregateId è string
  type: ItemDetailType;
  title: string;

  // Condiviso da entrambi
  metadataTree: MetadataNodeVM[];

  // Specifico per DOCUMENT
  fileUrl?: string | null;

  // Specifico per AGGREGATE
  documentIndex?: DocumentIndexEntryVM[];
}
