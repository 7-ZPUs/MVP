import { IndexDipUC } from "../../use-case/utils/indexing/IndexDipUC";
import { PlatformPath } from "node:path";
import "../../use-case/utils/indexing/IndexResult";

class IndexDipService implements IndexDipUC {
  public async execute(dipPath: PlatformPath): Promise<IndexResult> {
    return { success: true };
  }
}

export { IndexDipService };
