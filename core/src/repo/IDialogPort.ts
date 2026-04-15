export const DIALOG_PORT_TOKEN = "IDialogPort";

export interface SaveDialogOptions {
  defaultName?: string;
}

export interface SaveDialogResult {
  canceled: boolean;
  filePath?: string;
}

export interface FolderDialogResult {
  canceled: boolean;
  folderPath?: string;
}

export interface ConfirmPrintResult {
  confirmed: boolean;
}

export interface IDialogPort {
  showSaveDialog(opts: SaveDialogOptions): Promise<SaveDialogResult>;
  showFolderDialog(): Promise<FolderDialogResult>;
  showConfirmPrint(fileCount: number): Promise<ConfirmPrintResult>;
}