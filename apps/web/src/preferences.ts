export const panelIds = [
  "project",
  "properties",
  "panel3d",
  "diagnostics",
  "calculations",
  "bom",
  "reports",
] as const;
export type PanelId = (typeof panelIds)[number];
export type Dock = "left" | "right" | "bottom";
export type PanelState = {
  dock: Dock;
  visible: boolean;
  collapsed: boolean;
  size: number;
};
export type Preferences = {
  theme: "dark" | "light";
  language: "en" | "de" | "yo" | "pcm";
  background: "white" | "dark" | "custom";
  color: string;
  panels: Record<PanelId, PanelState>;
};
export const storageKey = "adiguneplanai.interface.v1";
export function defaults(): Preferences {
  return {
    theme: "dark",
    language: "en",
    background: "white",
    color: "#ffffff",
    panels: Object.fromEntries(
      panelIds.map((id) => [
        id,
        {
          dock:
            id === "project" || id === "properties"
              ? "left"
              : id === "panel3d"
                ? "right"
                : "bottom",
          visible: true,
          collapsed: false,
          size: id === "project" ? 330 : 220,
        },
      ]),
    ) as Preferences["panels"],
  };
}
export function restorePreferences(raw: string | null): Preferences {
  const result = defaults();
  try {
    const value: unknown = raw ? JSON.parse(raw) : null;
    if (!value || typeof value !== "object") return result;
    const data = value as Record<string, unknown>;
    if (data.theme === "light" || data.theme === "dark")
      result.theme = data.theme;
    if (["en", "de", "yo", "pcm"].includes(String(data.language)))
      result.language = data.language as Preferences["language"];
    if (["white", "dark", "custom"].includes(String(data.background)))
      result.background = data.background as Preferences["background"];
    if (typeof data.color === "string" && /^#[0-9a-f]{6}$/i.test(data.color))
      result.color = data.color;
    if (data.panels && typeof data.panels === "object")
      for (const id of panelIds) {
        const p = (data.panels as Record<string, unknown>)[id];
        if (!p || typeof p !== "object") continue;
        const v = p as Record<string, unknown>;
        if (["left", "right", "bottom"].includes(String(v.dock)))
          result.panels[id].dock = v.dock as Dock;
        if (typeof v.visible === "boolean")
          result.panels[id].visible = v.visible;
        if (typeof v.collapsed === "boolean")
          result.panels[id].collapsed = v.collapsed;
        if (typeof v.size === "number" && Number.isFinite(v.size))
          result.panels[id].size = Math.min(600, Math.max(140, v.size));
      }
  } catch {
    /* Corrupted or unavailable browser preferences never prevent startup. */
  }
  return result;
}
