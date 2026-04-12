const fs = require('fs');
const filePath = '/workspaces/MVP/renderer/src/app/features/item-detail/ui/smart/document-actions/document-actions.component.ts';
let code = fs.readFileSync(filePath, 'utf8');

if (!code.includes('resetManualStatusEffect')) {
    const importReplacement = "import { Component, inject, input, signal, computed, effect } from '@angular/core';";
    code = code.replace(/import \{ Component, inject, input, signal, computed \}.*/g, importReplacement);
    const replacement = `
  manualStatus = signal<string | null>(null);

  resetManualStatusEffect = effect(() => {
    // Quando itemId() o itemType() cambiano, assicurati di resettare anche il manualStatus locale
    const id = this.itemId();
    const type = this.itemType();
    this.manualStatus.set(null);
  }, { allowSignalWrites: true });

  verificationStatus = computed(() => {
    return this.manualStatus() || this.initialVerificationStatus() || null;
  });`;
    code = code.replace(/manualStatus = signal<string \| null>\(null\);\s*verificationStatus = computed.*?;\}\);/s, replacement);
    fs.writeFileSync(filePath, code, 'utf8');
}
