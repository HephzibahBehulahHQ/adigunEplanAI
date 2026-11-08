import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import type { Project } from "../../../packages/electrical-model/project.ts";
import type { MessageKey } from "../../../packages/localization";
import help from "../../../docs/HELP.md?raw";

type Device = { reference: string; name: string; part?: string };
type HelpSection = { title: string; excerpt: string; body: string };
type Reply = {
  question: string;
} & (
  | { kind: "devices"; devices: Device[] }
  | { kind: "help"; sections: HelpSection[] }
);

const helpSections: HelpSection[] = help
  .split(/^## /m)
  .slice(1)
  .flatMap((section) => {
    const newline = section.indexOf("\n");
    if (newline < 0) return [];
    const title = section.slice(0, newline).trim();
    if (title === "Contents") return [];
    const body = section.slice(newline).trim().replace(/`/g, "");
    return [{ title, body, excerpt: body.split(/\r?\n\s*\r?\n/)[0] }];
  });

function findHelp(query: string) {
  const words = [...new Set(query.toLowerCase().match(/[a-z0-9]+/g) ?? [])];
  if (!words.length) return [];
  return helpSections
    .map((section) => {
      const heading = new Set(
        section.title.toLowerCase().match(/[a-z0-9]+/g) ?? [],
      );
      return {
        section,
        score: words.filter((word) => heading.has(word)).length,
      };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(({ section }) => section);
}

export function BotProjectChat({
  project,
  t,
  inputRef,
  composer,
}: {
  project: Project;
  t: (key: MessageKey) => string;
  inputRef: RefObject<HTMLInputElement | null>;
  composer: HTMLElement;
}) {
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState<"devices" | "help">("devices");
  const [history, setHistory] = useState<Reply[]>([]);
  const transcript = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (history.length) {
      transcript.current?.lastElementChild?.scrollIntoView({ block: "end" });
    }
  }, [history]);

  function ask() {
    const text = question.trim();
    if (!text) return;
    if (mode === "help") {
      setHistory((previous) => [
        ...previous.slice(-19),
        { question: text, kind: "help", sections: findHelp(text) },
      ]);
      setQuestion("");
      return;
    }
    const reference = text.toUpperCase();
    const devices = project.devices
      .filter((device) => device.reference.toUpperCase() === reference)
      .map(({ reference, name, partId }) => ({
        reference,
        name,
        part: project.manufacturerParts.find(({ id }) => id === partId)
          ?.partNumber,
      }));
    setHistory((previous) => [
      ...previous.slice(-19),
      { question: text, kind: "devices", devices },
    ]);
    setQuestion("");
  }

  return (
    <section className="bot-chat" aria-label={t("botDeviceLookup")}>
      <div
        className="bot-transcript"
        ref={transcript}
        role="log"
        aria-label={t("botDeviceLookup")}
      >
        {history.map((reply, index) => (
          <div key={index} className="bot-exchange">
            <p className="bot-question">{reply.question}</p>
            {reply.kind === "help" ? (
              reply.sections.length ? (
                <ul lang="en">
                  {reply.sections.map(({ title, excerpt, body }) => (
                    <li key={title}>
                      <details>
                        <summary>{title} · HELP.md</summary>
                        <p className="bot-help-body">{body}</p>
                      </details>
                      <p>{excerpt}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>{t("botNoHelpMatches")}</p>
              )
            ) : reply.devices.length ? (
              <ul>
                {reply.devices.map((device, position) => (
                  <li key={position}>
                    <strong>{device.reference}</strong> · {device.name}
                    {device.part && (
                      <span>
                        {" "}
                        · {t("partNumber")}: {device.part}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>{t("botReferenceMissing")}</p>
            )}
          </div>
        ))}
      </div>
      {createPortal(
        <form
          onSubmit={(event) => {
            event.preventDefault();
            ask();
          }}
        >
          <select
            aria-label={t("botTopic")}
            value={mode}
            onChange={(event) =>
              setMode(event.target.value === "help" ? "help" : "devices")
            }
          >
            <option value="devices">{t("botDeviceLookup")}</option>
            <option value="help">{t("botSearchHelp")}</option>
          </select>
          <label htmlFor="bot-device-reference">
            {t(mode === "devices" ? "botDeviceLookup" : "botSearchHelp")}
          </label>
          <div className="bot-compose">
            <input
              id="bot-device-reference"
              ref={inputRef}
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              maxLength={160}
              required
            />
            <button
              type="submit"
              aria-label={t("botAsk")}
              title={t("botAsk")}
              disabled={!question.trim()}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              >
                <path d="M3 10l18-7-7 18-3-8z M11 13l10-10" />
              </svg>
            </button>
          </div>
        </form>,
        composer,
      )}
    </section>
  );
}
