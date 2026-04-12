export interface IRouter {
  navigate(commands: (string | number | object)[], extras?: object): Promise<boolean>;
}

export interface IAngularRouter {
  navigate(commands: unknown[], extras?: object): Promise<boolean>;
}
