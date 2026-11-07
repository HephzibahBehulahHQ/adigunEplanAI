import { useState } from "react";
import { analyze } from "../../../packages/connectivity-engine/analyze.ts";
import type { Project } from "../../../packages/electrical-model/project.ts";
import type { MessageKey } from "../../../packages/localization";

type Props = {
  project: Project | null;
  t: (key: MessageKey) => string;
  close: () => void;
  openDiagnostics: () => void;
  openBom: () => void;
  openHelp: () => void;
};

export function AdigunBot({
  project,
  t,
  close,
  openDiagnostics,
  openBom,
  openHelp,
}: Props) {
  const [check, setCheck] = useState<{
    project: Project;
    errors: number;
    warnings: number;
  }>();
  const latest = check?.project === project ? check : undefined;

  return (
    <section
      className="bot-panel"
      id="adigun-bot"
      aria-labelledby="adigun-bot-title"
      onKeyDown={(event) => {
        if (event.key === "Escape") close();
      }}
    >
      <header className="bot-heading">
        <svg
          aria-hidden="true"
          width="27"
          height="27"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="4" y="6" width="16" height="14" rx="5" />
          <path d="M12 6V2M9 15h6M2 10v5m20-5v5" />
          <circle cx="9" cy="11" r="1" />
          <circle cx="15" cy="11" r="1" />
        </svg>
        <strong id="adigun-bot-title">Adigun BOT</strong>
        <button type="button" onClick={close} aria-label={t("close")}>
          ×
        </button>
      </header>
      <div className="bot-body">
        <p className="bot-mode">{t("botLocalTools")}</p>
        <p className="bot-context">{project?.name ?? t("noProject")}</p>
        <div
          className="bot-actions"
          role="group"
          aria-label={t("botQuickActions")}
        >
          <h3>{t("botQuickActions")}</h3>
          <button
            type="button"
            disabled={!project}
            onClick={() => {
              if (!project) return;
              const { findings } = analyze(project);
              setCheck({
                project,
                errors: findings.filter((item) => item.severity === "error")
                  .length,
                warnings: findings.filter((item) => item.severity === "warning")
                  .length,
              });
              openDiagnostics();
            }}
          >
            {t("botRunCheck")}
          </button>
          <button type="button" disabled={!project} onClick={openBom}>
            {t("bom")}
          </button>
          <button type="button" onClick={openHelp}>
            {t("help")}
          </button>
        </div>
        <div role="status">
          {latest && (
            <p>
              {t("errors")}: {latest.errors} · {t("warnings")}:{" "}
              {latest.warnings}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
