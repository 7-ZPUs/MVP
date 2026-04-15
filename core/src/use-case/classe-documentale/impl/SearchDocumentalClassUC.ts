import { inject, injectable } from "tsyringe";
import { ISearchDocumentalClassUC } from "../ISearchDocumentalClassUC";
import {
  DOCUMENT_CLASS_SEARCH_PORT_TOKEN,
  ISearchDocumentClassPort,
} from "../../../repo/IDocumentClassRepository";
import { DocumentClass } from "../../../entity/DocumentClass";

@injectable()
export class SearchDocumentalClassUC implements ISearchDocumentalClassUC {
  constructor(
    @inject(DOCUMENT_CLASS_SEARCH_PORT_TOKEN)
    private readonly repo: ISearchDocumentClassPort,
  ) {}

  execute(name: string): DocumentClass[] {
    const results = this.repo.searchDocumentalClasses(name);
    return results;
  }
}
