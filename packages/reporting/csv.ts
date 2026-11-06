/** RFC 4180 cells with spreadsheet formula neutralization for user-controlled text. */
export function csvReport(rows: (string | number | null)[][]): string {
  return (
    "\uFEFF" +
    rows
      .map((row) =>
        row
          .map((value) => {
            let text = value === null ? "" : String(value);
            if (typeof value === "string" && /^\s*[=+@-]/.test(text))
              text = "'" + text;
            return '"' + text.replace(/"/g, '""') + '"';
          })
          .join(","),
      )
      .join("\r\n") +
    "\r\n"
  );
}
