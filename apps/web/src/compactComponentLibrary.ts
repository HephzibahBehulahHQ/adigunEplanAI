import { plcKinds, plcSymbol } from "../../../packages/automation/plc.ts";
import { engineeringSymbols } from "../../../packages/component-library/symbols.ts";

import wagoTerminalBatch from "../../../packages/component-library/wago-terminal-batch.json";

import wagoPcbTerminalBatch from "../../../packages/component-library/wago-pcb-terminal-batch.json";
import wago2086PcbTerminalBatch from "../../../packages/component-library/wago-pcb-2086-batch.json";
import wagoStackablePcbTerminalBatch from "../../../packages/component-library/wago-pcb-236-256-batch.json";
import wago255257PcbTerminalBatch from "../../../packages/component-library/wago-pcb-255-257-batch.json";
import wagoMultipinPcbTerminalBatch from "../../../packages/component-library/wago-pcb-multipin-batch.json";

import wagoWinstaBatch from "../../../packages/component-library/wago-winsta-batch.json";
import wagoWinstaCableBatch from "../../../packages/component-library/wago-winsta-cable-batch.json";
import wagoWinstaTerminationBatch from "../../../packages/component-library/wago-winsta-termination-batch.json";
import wagoRelayBatch from "../../../packages/component-library/wago-relay-batch.json";
import wagoPowerSupplyBatch from "../../../packages/component-library/wago-power-supply-batch.json";
import wagoSingleChannelBreakerBatch from "../../../packages/component-library/wago-single-channel-breaker-batch.json";
import wagoMcsBatch from "../../../packages/component-library/wago-mcs-231-batch.json";
import wagoMcsFemaleBatch from "../../../packages/component-library/wago-mcs-232-batch.json";
import wagoMcsMidiBatch from "../../../packages/component-library/wago-mcs-721-batch.json";
import wagoMcsMicroBatch from "../../../packages/component-library/wago-mcs-733-batch.json";
import wagoMcsMiniBatch from "../../../packages/component-library/wago-mcs-734-batch.json";
import wagoMcsMaxiBatch from "../../../packages/component-library/wago-mcs-831-batch.json";
import wagoPluggableBatch from "../../../packages/component-library/wago-mcs-2231-209x-batch.json";
import wagoTwoRowBatch from "../../../packages/component-library/wago-mcs-713-batch.json";

import wagoDigitalIoBatch from "../../../packages/component-library/wago-digital-io-batch.json";

const mcsCatalog = [
  ...wagoMcsBatch,
  ...wagoMcsFemaleBatch,
  ...wagoMcsMidiBatch,
  ...wagoMcsMicroBatch,
  ...wagoMcsMiniBatch,
  ...wagoMcsMaxiBatch,
  ...wagoPluggableBatch,
  ...wagoTwoRowBatch,
];
const stackablePcbCatalog = [
  ...wagoStackablePcbTerminalBatch,
  ...wago255257PcbTerminalBatch,
  ...wagoMultipinPcbTerminalBatch,
];
const winstaCableCatalog = [
  ...wagoWinstaCableBatch,
  ...wagoWinstaTerminationBatch,
];

const symbols = plcKinds.map((kind) => {
  const { symbol: id, channels } = plcSymbol[kind];
  const symbol = engineeringSymbols.find((entry) => entry.id === id);
  if (!symbol) throw new Error(`Missing PLC library symbol ${id}`);
  return { kind, channels, symbol };
});

declare global {
  interface Window {
    AdigunCADEngine: {
      registerWagoDigitalIoBatch: (rows: typeof wagoDigitalIoBatch) => void;
      registerPlcSymbols: (entries: typeof symbols) => void;
      registerWagoTerminalBatch: (rows: typeof wagoTerminalBatch) => void;
      registerWagoPcbTerminalBatch: (rows: typeof wagoPcbTerminalBatch) => void;
      registerWago2086PcbTerminalBatch: (
        rows: typeof wago2086PcbTerminalBatch,
      ) => void;
      registerWagoStackablePcbTerminalBatch: (
        rows: typeof stackablePcbCatalog,
      ) => void;
      registerWagoWinstaBatch: (rows: typeof wagoWinstaBatch) => void;
      registerWagoWinstaCableBatch: (rows: typeof winstaCableCatalog) => void;
      registerWagoRelayBatch: (rows: typeof wagoRelayBatch) => void;
      registerWagoPowerSupplyBatch: (rows: typeof wagoPowerSupplyBatch) => void;
      registerWagoSingleChannelBreakerBatch: (
        rows: typeof wagoSingleChannelBreakerBatch,
      ) => void;
      registerWagoMcsBatch: (rows: typeof mcsCatalog) => void;
    };
  }
}

window.AdigunCADEngine.registerWagoTerminalBatch(wagoTerminalBatch);
window.AdigunCADEngine.registerWagoPcbTerminalBatch(wagoPcbTerminalBatch);
window.AdigunCADEngine.registerWago2086PcbTerminalBatch(
  wago2086PcbTerminalBatch,
);
window.AdigunCADEngine.registerWagoStackablePcbTerminalBatch(
  stackablePcbCatalog,
);
window.AdigunCADEngine.registerWagoWinstaBatch(wagoWinstaBatch);
window.AdigunCADEngine.registerWagoWinstaCableBatch(winstaCableCatalog);
window.AdigunCADEngine.registerWagoRelayBatch(wagoRelayBatch);
window.AdigunCADEngine.registerWagoPowerSupplyBatch(wagoPowerSupplyBatch);
window.AdigunCADEngine.registerWagoSingleChannelBreakerBatch(
  wagoSingleChannelBreakerBatch,
);
window.AdigunCADEngine.registerWagoMcsBatch(mcsCatalog);
window.AdigunCADEngine.registerPlcSymbols(symbols);
window.AdigunCADEngine.registerWagoDigitalIoBatch(wagoDigitalIoBatch);
window.dispatchEvent(new Event("adigun-component-library-ready"));
