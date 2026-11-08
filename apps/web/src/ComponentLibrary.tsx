import { lazy, Suspense } from "react";
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
  return (
    <div className="component-library">
      <LazyPanelBoundary message={t("catalogLoadError")}>
        <Suspense fallback={<p role="status">{t("catalogLoading")}</p>}>
          <CatalogPanel native={native} t={t} />
        </Suspense>
      </LazyPanelBoundary>
    </div>
  );
}
