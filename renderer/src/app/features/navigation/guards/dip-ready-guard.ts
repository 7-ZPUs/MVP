import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { DipFacade } from '../services/dip-facade';

export const dipReadyGuard: CanActivateFn = () => {
  const dipFacade = inject(DipFacade);
  const router = inject(Router);

  //TODO abbiamo effettivamente una pagina di loading? altrimenti va tolto
  return dipFacade.getState()().phase === 'ready' ? true : router.parseUrl('/loading');
};