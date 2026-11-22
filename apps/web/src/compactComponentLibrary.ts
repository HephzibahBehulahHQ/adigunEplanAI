import { plcKinds, plcSymbol } from "../../../packages/automation/plc.ts";
import { engineeringSymbols } from "../../../packages/component-library/symbols.ts";

import wagoTerminalBatch from "../../../packages/component-library/wago-terminal-batch.json";

import wagoPcbTerminalBatch from "../../../packages/component-library/wago-pcb-terminal-batch.json";

const symbols = plcKinds.map((kind) => {
  const { symbol: id, channels } = plcSymbol[kind];
  const symbol = engineeringSymbols.find((entry) => entry.id === id);
  if (!symbol) throw new Error(`Missing PLC library symbol ${id}`);
  return { kind, channels, symbol };
});

declare global {
  interface Window {
    AdigunCADEngine: {
      registerPlcSymbols: (entries: typeof symbols) => void;
      registerWagoTerminalBatch: (rows: typeof wagoTerminalBatch) => void;
      registerWagoPcbTerminalBatch: (rows: typeof wagoPcbTerminalBatch) => void;
    };
  }
}

window.AdigunCADEngine.registerWagoTerminalBatch(wagoTerminalBatch);
window.AdigunCADEngine.registerWagoPcbTerminalBatch(wagoPcbTerminalBatch);
window.AdigunCADEngine.registerPlcSymbols(symbols);
window.dispatchEvent(new Event("adigun-component-library-ready"));
