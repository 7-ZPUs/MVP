import { Routes } from '@angular/router';
import { signal } from '@angular/core';
import { ItemDetailPageComponent } from './ui/smart/item-detail-page/item-detail-page.component';

import { ITEM_DETAIL_FACADE_TOKEN } from './contracts/IItemDetailFacade';
import { ItemDetailFacade } from './services/item-detail.facade';

import { OUTPUT_FACADE_TOKEN } from './contracts/IOutputFacade';
import { INTEGRITY_FACADE_TOKEN } from './contracts/IIntegrityFacade';

const mockOutputFacade = {
  isWorking: signal(false),
  exportItem: async (id: string) => {
    console.log(`Esporto ${id}...`);
  },
  printItem: async (id: string) => {
    console.log(`Stampo ${id}...`);
  },
};

const mockIntegrityFacade = {
  isVerifying: signal(false),
  integrityStatus: signal('UNKNOWN' as const),
  verifyIntegrity: async (id: string) => {
    console.log(`Verifico firme di ${id}...`);
  },
};

export const ITEM_DETAIL_ROUTES: Routes = [
  {
    // Il path qui è relativo a come lo chiameremo nel file app.routes.ts
    path: ':itemType/:itemId',
    component: ItemDetailPageComponent,
    providers: [
      {
        provide: ITEM_DETAIL_FACADE_TOKEN,
        useClass: ItemDetailFacade,
      },
      {
        provide: OUTPUT_FACADE_TOKEN,
        useValue: mockOutputFacade,
      },
      {
        provide: INTEGRITY_FACADE_TOKEN,
        useValue: mockIntegrityFacade,
      },
    ],
  },
];
