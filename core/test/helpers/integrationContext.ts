import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import Database from 'better-sqlite3';

import { Dip } from '../../src/entity/Dip';
import { DocumentClass } from '../../src/entity/DocumentClass';
import { Process } from '../../src/entity/Process';
import { Document } from '../../src/entity/Document';
import { File } from '../../src/entity/File';
import { Metadata } from '../../src/value-objects/Metadata';
import { DipRepository } from '../../src/repo/impl/DipRepository';
import { DocumentClassRepository } from '../../src/repo/impl/DocumentClassRepository';
import { ProcessRepository } from '../../src/repo/impl/ProcessRepository';
import { DocumentRepository } from '../../src/repo/impl/DocumentRepository';
import { FileRepository } from '../../src/repo/impl/FileRepository';
import type { DatabaseProvider } from '../../src/repo/impl/DatabaseProvider';

export type IntegrationContext = {
    tempDir: string;
    dbPath: string;
    db: Database.Database;
    dipRepository: DipRepository;
    documentClassRepository: DocumentClassRepository;
    processRepository: ProcessRepository;
    documentRepository: DocumentRepository;
    fileRepository: FileRepository;
};

export type SeededGraph = {
    dipId: number;
    documentClassId: number;
    processId: number;
    documentId: number;
    secondDocumentId: number;
    mainFileId: number;
    attachmentFileId: number;
    secondDocumentFileId: number;
};

export async function createIntegrationContext(prefix: string): Promise<IntegrationContext> {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
    const dbPath = path.join(tempDir, 'test.db');
    const db = new Database(dbPath);
    db.pragma('foreign_keys = ON');

    const dbProvider = { db } as DatabaseProvider;

    const dipRepository = new DipRepository(dbProvider);
    const documentClassRepository = new DocumentClassRepository(dbProvider);
    const processRepository = new ProcessRepository(dbProvider);
    const documentRepository = new DocumentRepository(dbProvider);
    const fileRepository = new FileRepository(dbProvider);

    return {
        tempDir,
        dbPath,
        db,
        dipRepository,
        documentClassRepository,
        processRepository,
        documentRepository,
        fileRepository,
    };
}

export async function disposeIntegrationContext(context: IntegrationContext): Promise<void> {
    context.db.close();
    await fs.rm(context.tempDir, { recursive: true, force: true });
}

export function seedBaseGraph(context: IntegrationContext, basePath: string): SeededGraph {
    const dip = context.dipRepository.save(new Dip('dip-uuid-1'));

    const documentClass = context.documentClassRepository.save(
        new DocumentClass(dip.getId() ?? 0, 'doc-class-1', 'Classe Uno', '2026-03-25T12:00:00Z'),
    );

    const process = context.processRepository.save(
        new Process(documentClass.getId() ?? 0, 'process-1', [new Metadata('workflow', 'A')]),
    );

    const document = context.documentRepository.save(
        new Document('document-1', [new Metadata('title', 'Documento A')], process.getId() ?? 0),
    );

    const secondDocument = context.documentRepository.save(
        new Document('document-2', [new Metadata('title', 'Documento B')], process.getId() ?? 0),
    );

    const mainFile = context.fileRepository.save(
        new File('main.txt', path.join(basePath, 'main.txt'), '', true, document.getId() ?? 0),
    );

    const attachmentFile = context.fileRepository.save(
        new File('attachment.txt', path.join(basePath, 'attachment.txt'), '', false, document.getId() ?? 0),
    );

    const secondDocumentFile = context.fileRepository.save(
        new File('second.txt', path.join(basePath, 'second.txt'), '', true, secondDocument.getId() ?? 0),
    );

    return {
        dipId: dip.getId() ?? 0,
        documentClassId: documentClass.getId() ?? 0,
        processId: process.getId() ?? 0,
        documentId: document.getId() ?? 0,
        secondDocumentId: secondDocument.getId() ?? 0,
        mainFileId: mainFile.getId() ?? 0,
        attachmentFileId: attachmentFile.getId() ?? 0,
        secondDocumentFileId: secondDocumentFile.getId() ?? 0,
    };
}

export type RegisteredHandler = (event: unknown, ...args: unknown[]) => unknown;

export class FakeIpcMain {
    private readonly handlers = new Map<string, RegisteredHandler>();

    handle(channel: string, listener: RegisteredHandler): void {
        this.handlers.set(channel, listener);
    }

    invoke<T>(channel: string, ...args: unknown[]): T {
        const handler = this.handlers.get(channel);
        if (!handler) {
            throw new Error(`No handler registered for channel '${channel}'`);
        }
        return handler({}, ...args) as T;
    }

    async invokeAsync<T>(channel: string, ...args: unknown[]): Promise<T> {
        const result = this.invoke<Promise<T> | T>(channel, ...args);
        return Promise.resolve(result);
    }
}
