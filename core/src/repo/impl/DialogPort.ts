import { injectable } from "tsyringe";
import { dialog } from "electron";
import type { IDialogPort, SaveDialogOptions, SaveDialogResult, FolderDialogResult, ConfirmPrintResult } from "../IDialogPort";

@injectable()
export class ElectronDialogPort implements IDialogPort {

  async showSaveDialog({ defaultName }: SaveDialogOptions): Promise<SaveDialogResult> {
    const result = await dialog.showSaveDialog({
      defaultPath: defaultName,
      filters: [{ name: "All Files", extensions: ["*"] }],
    });
    return { canceled: result.canceled, filePath: result.filePath };
  }

  async showFolderDialog(): Promise<FolderDialogResult> {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });
    return {
      canceled: result.canceled,
      folderPath: result.filePaths[0] ?? undefined,
    };
  }

  async showConfirmPrint(fileCount: number): Promise<ConfirmPrintResult> {
    const { response } = await dialog.showMessageBox({
      type: "question",
      buttons: ["Stampa", "Annulla"],
      defaultId: 0,
      cancelId: 1,
      title: "Conferma stampa",
      message: `Stai per stampare ${fileCount} documenti.`,
      detail: `Attenzione che proseguendo verranno aperte ${fileCount} finestre di stampa. Vuoi continuare comunque?`,
    });
    return { confirmed: response === 0 };
  }
}