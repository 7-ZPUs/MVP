//import { catchError, defer, from, Observable } from 'rxjs';
//import { IIndexingChannel } from '../contracts/semantic-index.interface';
//import { SemanticIndexState } from '../domain/semantic-filter-models';
//import { IErrorHandler } from '../../../shared/contracts/error-handler.interface';
//import { IElectronContextBridge } from '../../../shared/contracts/electron-context-bridge.interface';
//
//export class IndexingIpcGateway implements IIndexingChannel {
//  constructor(
//    private readonly contextBridge: IElectronContextBridge,
//    private readonly errorHandler: IErrorHandler,
//  ) {}
//
//  public getIndexingStatus(): Observable<SemanticIndexState> {
//    return defer(() =>
//      from(this.contextBridge.invoke<SemanticIndexState>('ipc:indexing:status')),
//    ).pipe(
//      catchError((err) => {
//        throw this.errorHandler.handle(err);
//      }),
//    );
//  }
//}
