import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { DipFacade } from '../service/dip-facade';

export const dipReadyGuard: CanActivateFn = () => {
  const dipFacade = inject(DipFacade);
  return dipFacade.getState()().phase === 'ready';
};