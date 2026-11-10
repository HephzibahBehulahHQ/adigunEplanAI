import type { Project } from "../../../packages/electrical-model/project.ts";
import { dictionaries } from "../../../packages/localization";

export function DrawingSheetFrame({
  project,
  page,
}: {
  project: Project;
  page: Project["pages"][number];
}) {
  const document = project.documents.find(({ id }) => id === page.documentId);
  const labels = dictionaries[document?.outputLanguage ?? "en"];
  const { widthMm: width, heightMm: height } = page;
  const scale = Math.min(1, width / 210, height / 148);
  const inset = 8 * scale;
  const footer = height - 22 * scale;
  const frameWidth = width - 2 * inset;
  const frameHeight = height - 2 * inset;
  const columns = Math.min(12, Math.max(2, Math.round(frameWidth / 50)));
  const rows = Math.min(12, Math.max(2, Math.round(frameHeight / 50)));
  const cells = [
    { start: 0, end: 0.34, label: labels.projectName, value: project.name },
    { start: 0.34, end: 0.6, label: labels.document, value: document?.name },
    { start: 0.6, end: 0.82, label: labels.pageName, value: page.name },
    {
      start: 0.82,
      end: 1,
      label: labels.sheetSize,
      value: `${width} × ${height} mm`,
    },
  ];
  return (
    <g className="drawing-sheet-frame" pointerEvents="none" fill="currentColor">
      <g fill="none" stroke="currentColor" strokeWidth={0.3 * scale}>
        <rect
          x={inset / 2}
          y={inset / 2}
          width={width - inset}
          height={height - inset}
        />
        <rect x={inset} y={inset} width={frameWidth} height={frameHeight} />
        <path d={`M${inset} ${footer}H${width - inset}`} />
      </g>
      <g
        aria-hidden="true"
        fontSize={2.5 * scale}
        textAnchor="middle"
        dominantBaseline="central"
      >
        {Array.from({ length: columns }, (_, i) => {
          const x = inset + ((i + 0.5) * frameWidth) / columns;
          return (
            <g key={i}>
              <text x={x} y={inset * 0.75}>
                {i + 1}
              </text>
              <text x={x} y={height - inset * 0.75}>
                {i + 1}
              </text>
            </g>
          );
        })}
        {Array.from({ length: rows }, (_, i) => {
          const y = inset + ((i + 0.5) * frameHeight) / rows;
          const letter = String.fromCharCode(65 + i);
          return (
            <g key={i}>
              <text x={inset * 0.75} y={y}>
                {letter}
              </text>
              <text x={width - inset * 0.75} y={y}>
                {letter}
              </text>
            </g>
          );
        })}
      </g>
      <g className="drawing-title-block">
        {cells.map(({ start, end, label, value }) => {
          const x = inset + start * frameWidth;
          const cellWidth = (end - start) * frameWidth;
          return (
            <svg
              key={start}
              x={x}
              y={footer}
              width={cellWidth}
              height={14 * scale}
              overflow="hidden"
            >
              {start > 0 && (
                <path
                  d={`M0 0V${14 * scale}`}
                  stroke="currentColor"
                  strokeWidth={0.6 * scale}
                />
              )}
              <text x={2 * scale} y={4 * scale} fontSize={2.5 * scale}>
                {label}
              </text>
              <text
                x={2 * scale}
                y={10 * scale}
                fontSize={3.5 * scale}
                fontWeight={600}
              >
                {value}
              </text>
            </svg>
          );
        })}
      </g>
    </g>
  );
}
