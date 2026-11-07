import { useState, type RefObject } from "react";
import type { Project } from "../../../packages/electrical-model/project.ts";
import type { MessageKey } from "../../../packages/localization";

type Reply = {
  question: string;
  devices: { reference: string; name: string; part?: string }[];
};

export function BotProjectChat({
  project,
  t,
  inputRef,
}: {
  project: Project;
  t: (key: MessageKey) => string;
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<Reply[]>([]);

  function ask() {
    const text = question.trim();
    if (!text) return;
    const reference = text.toLocaleUpperCase();
    const devices = project.devices
      .filter((device) => device.reference.toLocaleUpperCase() === reference)
      .map(({ reference, name, partId }) => ({
        reference,
        name,
        part: project.manufacturerParts.find(({ id }) => id === partId)
          ?.partNumber,
      }));
    setHistory((previous) => [
      ...previous.slice(-19),
      { question: text, devices },
    ]);
    setQuestion("");
  }

  return (
    <section className="bot-chat" aria-label={t("botDeviceLookup")}>
      <div
        className="bot-transcript"
        role="log"
        aria-label={t("botDeviceLookup")}
      >
        {history.map(({ question, devices }, index) => (
          <div key={index} className="bot-exchange">
            <p className="bot-question">{question}</p>
            {devices.length ? (
              <ul>
                {devices.map((device, position) => (
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
      <form
        onSubmit={(event) => {
          event.preventDefault();
          ask();
        }}
      >
        <label htmlFor="bot-device-reference">{t("botDeviceLookup")}</label>
        <div className="bot-compose">
          <input
            id="bot-device-reference"
            ref={inputRef}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            maxLength={160}
            required
          />
          <button type="submit" disabled={!question.trim()}>
            {t("botAsk")}
          </button>
        </div>
      </form>
    </section>
  );
}
