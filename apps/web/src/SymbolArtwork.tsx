import type { Project } from "../../../packages/electrical-model/project.ts";

type Shape = NonNullable<
  Project["symbolDefinitions"][number]["artwork"]
>[number];
export function SymbolArtwork({ artwork }: { artwork: readonly Shape[] }) {
  return (
    <>
      {artwork.map((shape, index) =>
        shape.kind === "line" ? (
          <line
            key={index}
            x1={shape.from.x}
            y1={shape.from.y}
            x2={shape.to.x}
            y2={shape.to.y}
          />
        ) : (
          <circle
            key={index}
            cx={shape.center.x}
            cy={shape.center.y}
            r={shape.radiusMm}
          />
        ),
      )}
    </>
  );
}
