import { useState } from "react";
import type { Project } from "../../../packages/electrical-model/project.ts";
import type { MessageKey } from "../../../packages/localization";
import {
  panelFaces,
  panelFaceSize,
  panelFaceSvg,
  featureOutline,
  savePanelFeature,
  removePanelFeature,
  type PanelFace,
  type PanelFeature,
} from "../../../packages/panel-engineering/features.ts";
import type { Enclosure } from "../../../packages/panel-engineering/commands.ts";
import { downloadFile } from "./download";

const faceKeys: Record<PanelFace, MessageKey> = {
  back: "panelFaceBack",
  front: "panelFaceFront",
  left: "panelFaceLeft",
  right: "panelFaceRight",
  top: "panelFaceTop",
  bottom: "panelFaceBottom",
};
type Props = {
  project: Project;
  enclosure: Enclosure;
  run: (change: (draft: Project) => Project) => boolean;
  t: (key: MessageKey) => string;
};

export function PanelFeatureTools({ project, enclosure, run, t }: Props) {
  const [selectedId, setSelectedId] = useState("");
  const [face, setFace] = useState<PanelFace>("back");
  const feature = enclosure.features?.find((item) => item.id === selectedId);
  const size = panelFaceSize(enclosure, face);
  return (
    <details className="panel-feature-tools">
      <summary>{t("panelFeatures")}</summary>
      <p>{t("panelFeaturesScope")}</p>
      <label>
        {t("panelFeatures")}
        <select
          aria-label={t("panelFeatures")}
          value={feature?.id ?? ""}
          onChange={(event) => {
            setSelectedId(event.target.value);
            const item = enclosure.features?.find(
              (item) => item.id === event.target.value,
            );
            if (item) setFace(item.face);
          }}
        >
          <option value="">{t("panelNewFeature")}</option>
          {enclosure.features?.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} — {t(faceKeys[item.face])}
            </option>
          ))}
        </select>
      </label>
      <FeatureForm
        key={feature ? JSON.stringify(feature) : "new"}
        {...{ enclosure, feature, run, t, face, setFace }}
        selected={setSelectedId}
      />
      <figure>
        <figcaption>
          {t(faceKeys[face])}: {size.widthMm} × {size.heightMm} mm
        </figcaption>
        <svg
          role="img"
          aria-label={`${t("panelFeatures")} — ${t(faceKeys[face])}`}
          viewBox={`-20 -20 ${size.widthMm + 40} ${size.heightMm + 40}`}
        >
          <rect
            width={size.widthMm}
            height={size.heightMm}
            className="panel-enclosure-outline"
          />
          {(enclosure.features ?? [])
            .filter((item) => item.face === face)
            .map((item) => (
              <g key={item.id} data-panel-feature={item.id}>
                <polyline
                  points={featureOutline(item)
                    .map((point) => `${point.x},${point.y}`)
                    .join(" ")}
                  fill="none"
                  stroke={item.id === selectedId ? "#22d3ee" : "currentColor"}
                  strokeWidth="1"
                />
                <path
                  d={`M${item.positionMm.x - 3},${item.positionMm.y}h6 M${item.positionMm.x},${item.positionMm.y - 3}v6`}
                  stroke="currentColor"
                />
                <text
                  x={item.positionMm.x + item.widthMm / 2 + 3}
                  y={item.positionMm.y}
                  fontSize="10"
                  fill="currentColor"
                >
                  {item.name}
                </text>
                <title>
                  {item.name}: {item.positionMm.x}, {item.positionMm.y};{" "}
                  {item.widthMm} × {item.heightMm} mm
                </title>
              </g>
            ))}
        </svg>
      </figure>
      <button
        onClick={() =>
          downloadFile(
            `panel-${face}.svg`,
            panelFaceSvg(project, enclosure.id, face, t("panelFeaturesScope")),
            "image/svg+xml",
          )
        }
      >
        {t("panelDownloadFaceSvg")}
      </button>
    </details>
  );
}

function FeatureForm({
  enclosure,
  feature,
  run,
  selected,
  t,
  face,
  setFace,
}: Omit<Props, "project"> & {
  feature?: PanelFeature;
  selected: (id: string) => void;
  face: PanelFace;
  setFace: (face: PanelFace) => void;
}) {
  const [shape, setShape] = useState<PanelFeature["shape"]>(
    feature?.shape ?? "circle",
  );
  const size = panelFaceSize(enclosure, face);
  return (
    <form
      aria-label={t("panelSaveFeature")}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const widthMm = Number(data.get("width"));
        let id = feature?.id ?? "";
        if (
          run((project) => {
            const next = savePanelFeature(
              project,
              enclosure.id,
              {
                name: String(data.get("name")),
                kind: String(data.get("kind")) as PanelFeature["kind"],
                face,
                shape,
                positionMm: {
                  x: Number(data.get("u")),
                  y: Number(data.get("v")),
                },
                widthMm,
                heightMm:
                  shape === "circle" ? widthMm : Number(data.get("height")),
              },
              feature?.id,
            );
            id =
              feature?.id ??
              next.enclosures
                .find((item) => item.id === enclosure.id)!
                .features!.at(-1)!.id;
            return next;
          })
        )
          selected(id);
      }}
    >
      <div className="panel-fields">
        <label>
          {t("panelFeatureName")}
          <input
            name="name"
            defaultValue={feature?.name ?? t("panelNewFeature")}
            maxLength={160}
            required
          />
        </label>
        <label>
          {t("panelFeatureKind")}
          <select
            aria-label={t("panelFeatureKind")}
            name="kind"
            defaultValue={feature?.kind ?? "mounting-hole"}
          >
            <option value="mounting-hole">{t("panelMountingHole")}</option>
            <option value="cable-entry">{t("panelCableEntry")}</option>
          </select>
        </label>
        <label>
          {t("panelFeatureFace")}
          <select
            aria-label={t("panelFeatureFace")}
            value={face}
            onChange={(event) => setFace(event.target.value as PanelFace)}
          >
            {panelFaces.map((value) => (
              <option key={value} value={value}>
                {t(faceKeys[value])}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("panelFeatureShape")}
          <select
            aria-label={t("panelFeatureShape")}
            value={shape}
            onChange={(event) =>
              setShape(event.target.value as PanelFeature["shape"])
            }
          >
            <option value="circle">{t("panelCircle")}</option>
            <option value="rectangle">{t("panelRectangle")}</option>
          </select>
        </label>
      </div>
      <div className="panel-fields" key={face}>
        <label>
          {t("panelCenterU")}
          <input
            name="u"
            type="number"
            step="any"
            min="0"
            max={size.widthMm}
            defaultValue={feature?.positionMm.x ?? size.widthMm / 2}
            required
          />
        </label>
        <label>
          {t("panelCenterV")}
          <input
            name="v"
            type="number"
            step="any"
            min="0"
            max={size.heightMm}
            defaultValue={feature?.positionMm.y ?? size.heightMm / 2}
            required
          />
        </label>
        <label>
          {t(shape === "circle" ? "panelDiameter" : "componentWidth")}
          <input
            name="width"
            type="number"
            step="any"
            min="0.001"
            max={size.widthMm}
            defaultValue={feature?.widthMm ?? Math.min(10, size.widthMm)}
            required
          />
        </label>
        {shape === "rectangle" && (
          <label>
            {t("componentHeight")}
            <input
              name="height"
              type="number"
              step="any"
              min="0.001"
              max={size.heightMm}
              defaultValue={feature?.heightMm ?? Math.min(10, size.heightMm)}
              required
            />
          </label>
        )}
      </div>
      <button type="submit">{t("panelSaveFeature")}</button>
      {feature && (
        <button
          type="button"
          onClick={() => {
            if (
              run((project) =>
                removePanelFeature(project, enclosure.id, feature.id),
              )
            )
              selected("");
          }}
        >
          {t("panelRemoveFeature")}
        </button>
      )}
    </form>
  );
}
