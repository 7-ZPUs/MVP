export type BootstrapState = "loading" | "success" | "failure";

export interface BootstrapStatus {
  state: BootstrapState;
  message?: string;
}

export const BOOTSTRAP_DIP_NOT_FOUND_MESSAGE =
  "Pacchetto DiP non rilevato: l'eseguibile deve trovarsi all'interno della directory del DiP. Esempio: /directory/dip.xyz/DIPReader-x.y.z.exe";

export const BOOTSTRAP_LOADING_STATUS: BootstrapStatus = {
  state: "loading",
};

export function isBootstrapStatus(value: unknown): value is BootstrapStatus {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as BootstrapStatus;
  return (
    candidate.state === "loading" ||
    candidate.state === "success" ||
    candidate.state === "failure"
  );
}
