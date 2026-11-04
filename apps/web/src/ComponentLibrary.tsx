import { lazy, Suspense, useState } from "react";
import { LazyPanelBoundary } from "./LazyPanelBoundary";
import type { NativeProjects } from "./useNativeProjects";
import type { MessageKey } from "../../../packages/localization";
const CatalogPanel = lazy(() =>
  import("./CatalogPanel").then((module) => ({ default: module.CatalogPanel })),
);
export function ComponentLibrary({
  native,
  t,
}: {
  native: NativeProjects;
  t: (key: MessageKey) => string;
}) {
  const [opened, setOpened] = useState(false);
  return (
    <details
      className="component-library"
      onToggle={(e) => {
        if (e.currentTarget.open) setOpened(true);
      }}
    >
      <summary>{t("componentLibrary")}</summary>
      {opened && (
        <LazyPanelBoundary message={t("catalogLoadError")}>
          <Suspense fallback={<p role="status">{t("catalogLoading")}</p>}>
            <CatalogPanel native={native} t={t} />
          </Suspense>
        </LazyPanelBoundary>
      )}
    </details>
  );
}
