export function Glyph({
  kind,
  width,
  height,
}: {
  kind: string;
  width: number;
  height: number;
}) {
  switch (kind) {
    case "terminal":
      return <rect x={-2} y={-2} width={4} height={4} />;
    case "junction":
      return <circle r={1.2} fill="currentColor" />;
    case "resistor":
      return (
        <>
          <path d="M-10 0H-6 M6 0H10" />
          <rect x={-6} y={-2.5} width={12} height={5} />
        </>
      );
    case "fuse":
      return (
        <>
          <path d="M-10 0H10" />
          <rect x={-6} y={-2.5} width={12} height={5} />
        </>
      );
    case "contact":
      return <path d="M-10 0H-5 M5 0H10 M-5 0L4 -4" />;
    case "coil":
      return (
        <>
          <path d="M-9 0H-5 M5 0H9" />
          <rect x={-5} y={-4} width={10} height={8} />
        </>
      );
    case "lamp":
      return (
        <>
          <circle r={5} />
          <path d="M-3.5 -3.5L3.5 3.5 M-3.5 3.5L3.5 -3.5 M-6 0H-5 M5 0H6" />
        </>
      );
    case "motor":
      return (
        <>
          <circle r={8} />
          <path d="M-9 0H-8 M8 0H9" />
          <text
            x={0}
            y={1.5}
            textAnchor="middle"
            fontSize={5}
            stroke="none"
            fill="currentColor"
          >
            M
          </text>
        </>
      );
    case "ground":
      return <path d="M0 -6V0 M-5 0H5 M-3 2H3 M-1 4H1" />;
    default:
      return (
        <rect x={-width / 2} y={-height / 2} width={width} height={height} />
      );
  }
}
