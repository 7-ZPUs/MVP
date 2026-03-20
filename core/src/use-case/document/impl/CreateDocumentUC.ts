import { inject, injectable } from 'tsyringe';
import { Document } from '../../../entity/Document';
import type { IDocumentRepository } from '../../../repo/IDocumentRepository';
import { DOCUMENTO_REPOSITORY_TOKEN } from '../../../repo/IDocumentRepository';
import type { CreateDocumentInput, ICreateDocumentUC } from '../ICreateDocumentUC';
import { Metadata } from '../../../value-objects/Metadata';

@injectable()
export class CreateDocumentUC implements ICreateDocumentUC {
  constructor(
    @inject(DOCUMENTO_REPOSITORY_TOKEN)
    private readonly repo: IDocumentRepository,
  ) {}

    execute(input: CreateDocumentInput): Document {
        const metadata = input.metadata.map((m) => new Metadata(m.name, m.value, m.type));
        const document = new Document(input.uuid, metadata, input.processId);
        return this.repo.save(document);
    }
}
