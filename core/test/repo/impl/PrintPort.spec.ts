import { describe, it, expect, vi, beforeEach } from "vitest";
// ---------------------------------------------------------------------------
// Import dopo i mock
// ---------------------------------------------------------------------------

import { BrowserWindow } from "electron";
import { PrintPort } from "../../../src/repo/impl/PrintPort";

const mockPrint = vi.fn();
const mockLoadURL = vi.fn();
const mockDestroy = vi.fn();
const mockOnce = vi.fn();

const mockWebContents = {
  print: mockPrint,
  once: mockOnce,
};

const mockWin = {
  loadURL: mockLoadURL,
  destroy: mockDestroy,
  webContents: mockWebContents,
};

vi.mock("electron", () => ({
  BrowserWindow: vi.fn(() => mockWin),
}));

vi.mock("tsyringe", () => ({
  injectable: () => () => { },
}));

// ---------------------------------------------------------------------------
// Helper: simula gli eventi di webContents.once
// ---------------------------------------------------------------------------

/**
 * Registra i listener con once() e poi li invoca manualmente,
 * permettendo di simulare did-finish-load e did-fail-load.
 */
const captureListeners = () => {
  const listeners = new Map<string, Function>();

  mockOnce.mockImplementation((event: string, handler: Function) => {
    listeners.set(event, handler);
  });

  return {
    emit: (event: string, ...args: unknown[]) => {
      const handler = listeners.get(event);
      if (!handler) throw new Error(`Listener non registrato: ${event}`);
      handler(...args);
    },
  };
};

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------

describe("PrintPort", () => {
  let port: PrintPort;

  beforeEach(() => {
    vi.clearAllMocks();
    port = new PrintPort();
  });

  it("crea una BrowserWindow nascosta con plugins abilitati", async () => {
    const emitter = captureListeners();
    mockPrint.mockImplementation((_opts: unknown, cb: Function) => cb(true, ""));

    const promise = port.printSingle("/tmp/doc.pdf", {});
    emitter.emit("did-finish-load");
    await promise;

    expect(BrowserWindow).toHaveBeenCalledWith({
      show: false,
      webPreferences: { plugins: true },
    });
  });

  it("carica il file con il protocollo file://", async () => {
    const emitter = captureListeners();
    mockPrint.mockImplementation((_opts: unknown, cb: Function) => cb(true, ""));

    const promise = port.printSingle("/tmp/doc.pdf", {});
    emitter.emit("did-finish-load");
    await promise;

    expect(mockLoadURL).toHaveBeenCalledWith("file:///tmp/doc.pdf");
  });

  it("chiama print con le opzioni fornite dopo did-finish-load", async () => {
    const emitter = captureListeners();
    const opts = { silent: true, copies: 2 };
    mockPrint.mockImplementation((_opts: unknown, cb: Function) => cb(true, ""));

    const promise = port.printSingle("/tmp/doc.pdf", opts);
    emitter.emit("did-finish-load");
    await promise;

    expect(mockPrint).toHaveBeenCalledWith(opts, expect.any(Function));
  });

  it("risolve { success: true } quando la stampa riesce", async () => {
    const emitter = captureListeners();
    mockPrint.mockImplementation((_opts: unknown, cb: Function) => cb(true, ""));

    const promise = port.printSingle("/tmp/doc.pdf", {});
    emitter.emit("did-finish-load");
    const result = await promise;

    expect(result).toEqual({ success: true });
  });

  it("distrugge la finestra dopo una stampa riuscita", async () => {
    const emitter = captureListeners();
    mockPrint.mockImplementation((_opts: unknown, cb: Function) => cb(true, ""));

    const promise = port.printSingle("/tmp/doc.pdf", {});
    emitter.emit("did-finish-load");
    await promise;

    expect(mockDestroy).toHaveBeenCalledOnce();
  });

  it("risolve { success: false, error } quando la stampa fallisce", async () => {
    const emitter = captureListeners();
    mockPrint.mockImplementation((_opts: unknown, cb: Function) =>
      cb(false, "printer not found"),
    );

    const promise = port.printSingle("/tmp/doc.pdf", {});
    emitter.emit("did-finish-load");
    const result = await promise;

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe("printer not found");
    expect(result.errorCode).toBe("PRINT_ERROR");
  });

  it("distrugge la finestra anche quando la stampa fallisce", async () => {
    const emitter = captureListeners();
    mockPrint.mockImplementation((_opts: unknown, cb: Function) =>
      cb(false, "error"),
    );

    const promise = port.printSingle("/tmp/doc.pdf", {});
    emitter.emit("did-finish-load");
    await promise;

    expect(mockDestroy).toHaveBeenCalledOnce();
  });

  it("risolve { success: false, error } con il messaggio corretto su did-fail-load", async () => {
    const emitter = captureListeners();

    const promise = port.printSingle("/tmp/doc.pdf", {});
    emitter.emit("did-fail-load", {}, -6, "ERR_FILE_NOT_FOUND");
    const result = await promise;

    expect(result.success).toBe(false);
    expect(result.errorMessage).toBe("did-fail-load: ERR_FILE_NOT_FOUND (codice: -6)");
    expect(result.errorCode).toBe("LOAD_ERROR");
  });

  it("distrugge la finestra su did-fail-load", async () => {
    const emitter = captureListeners();

    const promise = port.printSingle("/tmp/doc.pdf", {});
    emitter.emit("did-fail-load", {}, -6, "ERR_FILE_NOT_FOUND");
    await promise;

    expect(mockDestroy).toHaveBeenCalledOnce();
  });

  it("non chiama print se il caricamento fallisce", async () => {
    const emitter = captureListeners();

    const promise = port.printSingle("/tmp/doc.pdf", {});
    emitter.emit("did-fail-load", {}, -6, "ERR_FILE_NOT_FOUND");
    await promise;

    expect(mockPrint).not.toHaveBeenCalled();
  });
});