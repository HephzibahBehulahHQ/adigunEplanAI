import { useState } from "react";
import {
  examples,
  buildExample,
} from "../../../packages/example-projects/index.ts";
import { serializeProject } from "../../../packages/electrical-model/project.ts";
import type { MessageKey } from "../../../packages/localization";
import type { NativeProjects } from "./useNativeProjects";
import { CommandIcon } from "./WorkspaceRibbon";

export function ExampleLibrary({
  native,
  t,
  opened,
}: {
  native: NativeProjects;
  t: (key: MessageKey) => string;
  opened: () => void;
}) {
  const [error, setError] = useState(false);
  return (
    <section className="example-library">
      <p>{t("demoScope")}</p>
      <div className="example-grid">
        {examples.map((example) => (
          <article key={example.id}>
            <CommandIcon
              kind={
                example.id === "building"
                  ? "building"
                  : example.id === "plc"
                    ? "panel"
                    : "circuit"
              }
            />
            <h3>{t(example.nameKey)}</h3>
            <p>{t(`category-${example.category}` as MessageKey)}</p>
            <button
              disabled={native.corrupt}
              onClick={() => {
                try {
                  const project = buildExample(example.id);
                  if (
                    native.importText(serializeProject(project), () => false)
                  ) {
                    native.selectPage(project.pages[0].id);
                    native.setView(example.view);
                    opened();
                  } else setError(true);
                } catch {
                  setError(true);
                }
              }}
            >
              {t("loadExample")}
            </button>
          </article>
        ))}
      </div>
      {error && <p role="alert">{t("invalidProject")}</p>}
    </section>
  );
}
