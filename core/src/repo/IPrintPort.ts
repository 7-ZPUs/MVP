import { WebContentsPrintOptions } from 'electron';

export const PRINT_PORT_TOKEN = Symbol("IPrintPort");

export interface IPrintPort {
  printSingle( absolutePath: string, opts: WebContentsPrintOptions ): Promise<{ success: boolean; error?: string }>
}