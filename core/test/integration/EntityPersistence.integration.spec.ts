import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import { IntegrityStatusEnum } from '../../src/value-objects/IntegrityStatusEnum';
import {
    createIntegrationContext,
    disposeIntegrationContext,
    seedBaseGraph,
    type IntegrationContext,
    type SeededGraph,
} from '../helpers/integrationContext';

describe('Entity persistence integration', () => {
    let context: IntegrationContext;
    let seeded: SeededGraph;

    beforeAll(async () => {
        context = await createIntegrationContext('entity-it-');
        await fs.writeFile(path.join(context.tempDir, 'main.txt'), 'main-content', 'utf-8');
        await fs.writeFile(path.join(context.tempDir, 'attachment.txt'), 'attachment-content', 'utf-8');
        await fs.writeFile(path.join(context.tempDir, 'second.txt'), 'second-content', 'utf-8');

        seeded = seedBaseGraph(context, context.tempDir);
    });

    afterAll(async () => {
        await disposeIntegrationContext(context);
    });

    it('persists and loads full hierarchy with metadata', () => {
        const dip = context.dipRepository.getById(seeded.dipId);
        const documentClass = context.documentClassRepository.getById(seeded.documentClassId);
        const process = context.processRepository.getById(seeded.processId);
        const document = context.documentRepository.getById(seeded.documentId);
        const files = context.fileRepository.getByDocumentId(seeded.documentId);

        expect(dip).not.toBeNull();
        expect(dip?.getUuid()).toBe('dip-uuid-1');
        expect(documentClass).not.toBeNull();
        expect(documentClass?.getProcessId()).toBe(seeded.dipId);
        expect(process).not.toBeNull();
        expect(process?.getDocumentClassId()).toBe(seeded.documentClassId);
        expect(document).not.toBeNull();
        expect(document?.getProcessId()).toBe(seeded.processId);
        expect(document?.getMetadata()).toHaveLength(1);
        expect(document?.getMetadata()[0].name).toBe('title');
        expect(files).toHaveLength(2);
        expect(files[0].getIsMain()).toBe(true);
    });

    it('aggregates integrity status through hierarchy', () => {
        context.fileRepository.updateIntegrityStatus(seeded.mainFileId, IntegrityStatusEnum.VALID);
        context.fileRepository.updateIntegrityStatus(seeded.attachmentFileId, IntegrityStatusEnum.INVALID);
        context.fileRepository.updateIntegrityStatus(seeded.secondDocumentFileId, IntegrityStatusEnum.UNKNOWN);

        const documentStatus = context.fileRepository.getAggregatedIntegrityStatusByDocumentId(
            seeded.documentId,
        );
        const processStatusBefore = context.documentRepository.getAggregatedIntegrityStatusByProcessId(
            seeded.processId,
        );

        context.documentRepository.updateIntegrityStatus(seeded.documentId, documentStatus);
        context.documentRepository.updateIntegrityStatus(seeded.secondDocumentId, IntegrityStatusEnum.UNKNOWN);

        const processStatusAfter = context.documentRepository.getAggregatedIntegrityStatusByProcessId(
            seeded.processId,
        );

        context.processRepository.updateIntegrityStatus(seeded.processId, processStatusAfter);

        const documentClassStatus = context.processRepository.getAggregatedIntegrityStatusByDocumentClassId(
            seeded.documentClassId,
        );

        context.documentClassRepository.updateIntegrityStatus(
            seeded.documentClassId,
            documentClassStatus,
        );

        const dipStatus = context.documentClassRepository.getAggregatedIntegrityStatusByDipId(
            seeded.dipId,
        );

        expect(documentStatus).toBe(IntegrityStatusEnum.INVALID);
        expect(processStatusBefore).toBe(IntegrityStatusEnum.UNKNOWN);
        expect(processStatusAfter).toBe(IntegrityStatusEnum.INVALID);
        expect(documentClassStatus).toBe(IntegrityStatusEnum.INVALID);
        expect(dipStatus).toBe(IntegrityStatusEnum.INVALID);
    });
});
