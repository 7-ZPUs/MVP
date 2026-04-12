const fs = require('fs');
const filePath = '/workspaces/MVP/renderer/src/app/features/verification/services/integrity.facade.ts';
let code = fs.readFileSync(filePath, 'utf8');

// Add import
const importToAdd = "import { IpcCacheService } from '../../../shared/infrastructure/ipc-cache.service';\n";
if (!code.includes('IpcCacheService')) {
  code = code.replace("import { AppError } from '../../../shared/domain';", "import { AppError } from '../../../shared/domain';\n" + importToAdd);
}

// Add injection
if (!code.includes('private readonly cacheService = inject(IpcCacheService);')) {
  code = code.replace("private readonly errorHandler = inject(IpcErrorHandlerService);", "private readonly errorHandler = inject(IpcErrorHandlerService);\n  private readonly cacheService = inject(IpcCacheService);");
}

// In verifyDip
if (!code.includes(`this.cacheService.invalidatePrefix('aggregate:');`)) {
  code = code.replace(
      "const status = await this.gateway.checkDipIntegrity(dipId);",
      "const status = await this.gateway.checkDipIntegrity(dipId);\n      this.cacheService.invalidatePrefix('aggregate:');\n      this.cacheService.invalidatePrefix('document:');"
  );
  
  code = code.replace(
      "status = await this.gateway.checkProcessIntegrity(idNum);\n      }",
      "status = await this.gateway.checkProcessIntegrity(idNum);\n      }\n      this.cacheService.invalidate(`${itemType === 'DOCUMENT' ? 'document' : 'aggregate'}:${itemId}`);\n      // To be safe, invalidate all if an aggregate is verified as it checks children\n      if (itemType === 'AGGREGATE') { this.cacheService.invalidatePrefix('document:'); }"
  );
}
fs.writeFileSync(filePath, code, 'utf8');
