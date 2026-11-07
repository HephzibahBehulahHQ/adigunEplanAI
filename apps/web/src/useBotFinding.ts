import { useEffect, useRef, useState } from "react";
import {
  analyze,
  type ConnectivityFinding,
} from "../../../packages/connectivity-engine/analyze.ts";
import type { Project } from "../../../packages/electrical-model/project.ts";

export type BotFinding = {
  key: string;
  project: Project;
  finding: ConnectivityFinding;
};

export function useBotFinding(project: Project | null) {
  const [enabled, setEnabled] = useState(true);
  const [suggestion, setSuggestion] = useState<BotFinding>();
  const [dismissed, setDismissed] = useState<string>();
  const lastOffer = useRef(0);
  const acknowledged = useRef(new Set<string>());
  const current = useRef<BotFinding | undefined>(undefined);
  useEffect(() => {
    if (!project || !enabled) return;
    let cooldown: ReturnType<typeof setTimeout> | undefined;
    const debounce = setTimeout(() => {
      const candidates = analyze(project)
        .findings.filter((finding) => finding.severity !== "info")
        .map((finding) => ({
          project,
          finding,
          key: JSON.stringify([project.id, finding.code, finding.entityIds]),
        }));
      const stillPresent = candidates.find(
        (item) =>
          item.key === current.current?.key &&
          !acknowledged.current.has(item.key),
      );
      if (stillPresent) {
        current.current = stillPresent;
        setSuggestion(stillPresent);
        return;
      }
      current.current = undefined;
      setSuggestion(undefined);
      const next = candidates.find(
        (item) => !acknowledged.current.has(item.key),
      );
      if (!next) return;
      cooldown = setTimeout(
        () => {
          lastOffer.current = Date.now();
          current.current = next;
          setSuggestion(next);
        },
        Math.max(0, 25000 - (Date.now() - lastOffer.current)),
      );
    }, 700);
    return () => {
      clearTimeout(debounce);
      clearTimeout(cooldown);
    };
  }, [project, enabled, dismissed]);

  const active =
    enabled && suggestion?.project === project && suggestion.key !== dismissed
      ? suggestion
      : undefined;
  return {
    active,
    enabled,
    setEnabled,
    dismiss() {
      if (!active) return;
      acknowledged.current.add(active.key);
      setDismissed(active.key);
    },
  };
}
