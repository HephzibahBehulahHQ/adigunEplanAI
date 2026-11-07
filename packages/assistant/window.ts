export type BotWindow = {
  open: boolean;
  minimized: boolean;
  maximized: boolean;
  live: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
};
export function clampWindow(
  state: BotWindow,
  viewportWidth: number,
  viewportHeight: number,
): BotWindow {
  const maxWidth = Math.max(1, viewportWidth - 16);
  const maxHeight = Math.max(48, viewportHeight - 16);
  const width = Math.min(
    maxWidth,
    Math.max(Math.min(320, maxWidth), Math.min(900, state.width)),
  );
  const height = Math.min(
    maxHeight,
    Math.max(Math.min(360, maxHeight), Math.min(800, state.height)),
  );
  return {
    ...state,
    width,
    height,
    x: Math.max(8, Math.min(viewportWidth - width - 8, state.x)),
    y: Math.max(8, Math.min(viewportHeight - 48, state.y)),
  };
}
export function restoreBotWindow(
  raw: string | null,
  viewportWidth: number,
  viewportHeight: number,
): BotWindow {
  const fallback: BotWindow = {
    open: false,
    minimized: false,
    maximized: false,
    live: true,
    x: viewportWidth - 370,
    y: 180,
    width: 350,
    height: 560,
  };
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === "object") {
      const value = parsed as Record<string, unknown>;
      for (const key of ["open", "minimized", "maximized", "live"] as const)
        if (typeof value[key] === "boolean") fallback[key] = value[key];
      for (const key of ["x", "y", "width", "height"] as const)
        if (typeof value[key] === "number" && Number.isFinite(value[key]))
          fallback[key] = value[key];
    }
  } catch {
    /* Invalid preferences never block engineering work. */
  }
  return clampWindow(fallback, viewportWidth, viewportHeight);
}
