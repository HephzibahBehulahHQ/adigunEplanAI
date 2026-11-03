import { parseDxfPlan } from "../../../packages/building-design/dxf-import.ts";
self.onmessage = (
  event: MessageEvent<{ text: string; name: string; scale?: number }>,
) => {
  try {
    self.postMessage({
      draft: parseDxfPlan(event.data.text, event.data.name, event.data.scale),
    });
  } catch (error) {
    self.postMessage({
      error: error instanceof Error ? error.message : "Invalid DXF",
    });
  }
};
