import { Injectable, inject, signal, computed, Signal } from '@angular/core';
import { DocumentDetailIpcGateway } from '../infrastructure/document-detail-ipc.gateway';
import { IpcErrorHandlerService } from '../../../../core/services/ipc-error-handler.service';
import { ItemDetailVM, MetadataNodeVM, ItemDetailType } from '../domain/detail.view-models';
import { IItemDetailFacade } from '../contracts/IItemDetailFacade';

@Injectable()
export class ItemDetailFacade implements IItemDetailFacade {
  // <-- 2. Implementa l'interfaccia
  private readonly gateway = inject(DocumentDetailIpcGateway);
  private readonly errorHandler = inject(IpcErrorHandlerService);

  // Stato interno scrivibile
  private readonly _item = signal<ItemDetailVM | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // 3. Proprietà pubbliche in sola lettura (richieste dall'interfaccia)
  public readonly item: Signal<ItemDetailVM | null> = computed(() => this._item());
  public readonly isLoading: Signal<boolean> = computed(() => this._isLoading());
  public readonly error: Signal<string | null> = computed(() => this._error());

  // 4. Metodo richiesto dall'interfaccia
  async loadItem(id: string, type: ItemDetailType): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      if (type === 'DOCUMENT') {
        await this.loadDocumentLogic(id);
      } else {
        await this.loadAggregateLogic(id);
      }
    } catch (rawError) {
      const enrichedError =
        typeof rawError === 'object' && rawError !== null ? rawError : new Error(String(rawError));
      (enrichedError as any).source = `ItemDetailFacade.loadItem(${type})`;
      (enrichedError as any).context = { id, type };
      const appError = this.errorHandler.handle(enrichedError);
      this._error.set(appError.message);
    } finally {
      this._isLoading.set(false);
    }
  }

  // --- LOGICA PRIVATA ---

  private async loadDocumentLogic(id: string): Promise<void> {
    const docDTO = await this.gateway.getDocumentById(Number(id));
    const filesDTO = await this.gateway.getFilesByDocument(Number(id));
    const mainFile = filesDTO.find((f) => f.isMain) || filesDTO[0];

    this._item.set({
      id: docDTO.uuid,
      type: 'DOCUMENT',
      title: mainFile ? mainFile.filename : `Doc ${docDTO.uuid}`,
      fileUrl: mainFile ? mainFile.path : null,
      metadataTree: this.parseMetadataTree(docDTO.metadata || []),
    });
  }

  private async loadAggregateLogic(id: string): Promise<void> {
    const aggregateDTO = await this.gateway.getAggregateById(id);

    // Escludiamo 'indiceDocumenti' perché lo mostriamo nella tabella a destra, non nell'albero!
    const { indiceDocumenti, ...metadatiAlbero } = aggregateDTO;

    // Questa funzione trasforma ricorsivamente il DTO in nodi visivi!
    const metadataTree = this.objectToMetadataTree(metadatiAlbero);

    this._item.set({
      id: aggregateDTO.idAgg.idAggregazione,
      type: 'AGGREGATE',
      title: `Fascicolo ${aggregateDTO.progressivo}`,
      metadataTree: metadataTree,
      // Passiamo l'indice dei documenti adattato per la nostra tabella UI
      documentIndex: indiceDocumenti.map((doc) => ({
        tipo: doc.tipoDocumento === 'DocumentoAmministativoinformatico' ? 'DAI' : 'DI',
        identificativo: doc.identificativo,
        titolo: `Documento ${doc.identificativo}`,
      })),
    });
  }

  // --- IL METODO MAGICO CHE CREA L'ALBERO ---
  private objectToMetadataTree(obj: any): MetadataNodeVM[] {
    const nodes: MetadataNodeVM[] = [];

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];

        // Formattiamo il nome della chiave (es. 'dataApertura' -> 'Data Apertura')
        const formattedName = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase());

        if (value === null || value === undefined) {
          continue; // Saltiamo i campi vuoti
        } else if (Array.isArray(value)) {
          // Se è un array (es. 'soggetti' o 'fasi')
          nodes.push({
            name: formattedName,
            type: 'Lista',
            children: value.map((item, index) => ({
              name: `Elemento ${index + 1}`,
              type: 'Oggetto',
              children:
                typeof item === 'object'
                  ? this.objectToMetadataTree(item)
                  : [{ name: 'Valore', type: 'String', value: String(item) }],
            })),
          });
        } else if (typeof value === 'object') {
          // Se è un oggetto annidato (es. 'classificazione', 'procedimentoAmministrativo')
          nodes.push({
            name: formattedName,
            type: 'Oggetto',
            children: this.objectToMetadataTree(value), // <-- RICORSIONE!
          });
        } else {
          // Se è un valore semplice (stringa, numero, booleano)
          nodes.push({
            name: formattedName,
            type: typeof value,
            value: String(value),
          });
        }
      }
    }
    return nodes;
  }

  private parseMetadataTree(metadataItems: any[]): MetadataNodeVM[] {
    return metadataItems.map((item) => {
      const node: MetadataNodeVM = { name: item.name, type: item.type };
      if (
        typeof item.value === 'string' &&
        (item.value.startsWith('[') || item.value.startsWith('{'))
      ) {
        try {
          const parsed = JSON.parse(item.value);
          node.children = this.parseMetadataTree(Array.isArray(parsed) ? parsed : [parsed]);
        } catch {
          node.value = item.value;
        }
      } else if (Array.isArray(item.value)) {
        node.children = this.parseMetadataTree(item.value);
      } else {
        node.value = item.value;
      }
      return node;
    });
  }
}
