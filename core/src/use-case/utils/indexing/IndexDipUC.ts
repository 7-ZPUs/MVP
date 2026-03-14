import { PlatformPath } from "node:path";

export interface IndexDipUC {
    execute(dipPath: PlatformPath): Promise<IndexResult>;
}