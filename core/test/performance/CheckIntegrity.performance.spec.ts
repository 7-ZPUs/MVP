import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { performance } from 'node:perf_hooks';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';

import { CheckFileIntegrityStatusUC } from '../../src/use-case/file/impl/CheckFileIntegrityStatusUC';
import { CryptoHashingService } from '../../src/services/impl/CryptoHashingService';
import { File } from '../../src/entity/File';
import { IntegrityStatusEnum } from '../../src/value-objects/IntegrityStatusEnum';
import {
    createIntegrationContext,
    disposeIntegrationContext,
    seedBaseGraph,
    type IntegrationContext,
} from '../helpers/integrationContext';

const runs = Number(process.env.PERF_RUNS ?? '3');
const fileCount = Number(process.env.PERF_FILES ?? '20');

function percentile(values: number[], p: number): number {
    const sorted = [...values].sort((left, right) => left - right);
    const index = Math.max(0, Math.ceil((p / 100) * sorted.length) - 1);
    return sorted[index];
}

describe('Integrity check performance', () => {
    let context: IntegrationContext;
    let fileIds: number[];
    let hashingService: CryptoHashingService;

    beforeAll(async () => {
        context = await createIntegrationContext('check-integrity-perf-');
        hashingService = new CryptoHashingService();

        const seeded = seedBaseGraph(context, context.tempDir);
        fileIds = [seeded.mainFileId, seeded.attachmentFileId, seeded.secondDocumentFileId];

        for (let index = 0; index < fileCount; index += 1) {
            const filename = `perf-${index}.txt`;
            const absolutePath = path.join(context.tempDir, filename);
            await fs.writeFile(absolutePath, `perf-content-${index}`, 'utf-8');

            const buffer = await fs.readFile(absolutePath);
            const arrayBuffer = buffer.buffer.slice(
                buffer.byteOffset,
                buffer.byteOffset + buffer.byteLength,
            );
            const hash = await hashingService.calcolaHash(arrayBuffer);

            const file = context.fileRepository.save(
                new File(filename, absolutePath, hash, index === 0, seeded.documentId),
            );
            fileIds.push(file.getId() ?? 0);
        }
    });

    afterAll(async () => {
        await disposeIntegrationContext(context);
    });

    it('measures cold runs of file integrity checks', async () => {
        const durations: number[] = [];
        let validated = 0;

        for (let runIndex = 0; runIndex < runs; runIndex += 1) {
            const checkFileIntegrity = new CheckFileIntegrityStatusUC(
                context.fileRepository,
                hashingService,
            );

            const start = performance.now();
            for (const fileId of fileIds) {
                const status = await checkFileIntegrity.execute(fileId);
                if (status === IntegrityStatusEnum.VALID) {
                    validated += 1;
                }
            }
            const end = performance.now();
            durations.push(end - start);
        }

        const average = durations.reduce((sum, value) => sum + value, 0) / durations.length;
        const p95 = percentile(durations, 95);
        const min = Math.min(...durations);
        const max = Math.max(...durations);

        console.info('[PERF-CHECK-INTEGRITY] file integrity batch');
        console.info(`[PERF-CHECK-INTEGRITY] runs=${runs} files=${fileIds.length}`);
        console.info(`[PERF-CHECK-INTEGRITY] validated=${validated}`);
        console.info(
            `[PERF-CHECK-INTEGRITY] ms avg=${average.toFixed(2)} p95=${p95.toFixed(2)} min=${min.toFixed(2)} max=${max.toFixed(2)}`,
        );

        expect(validated).toBeGreaterThan(0);
        expect(durations).toHaveLength(runs);
    });
});
