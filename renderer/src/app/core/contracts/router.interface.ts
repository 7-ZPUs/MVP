import { InjectionToken } from '@angular/core';

export interface IRouter {
  navigate(commands: (string | number | object)[], extras?: object): Promise<boolean>;
}

export const ROUTER_TOKEN = new InjectionToken<IRouter>('IRouter');

export interface IAngularRouter {
  navigate(commands: unknown[], extras?: object): Promise<boolean>;
}
