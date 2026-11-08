import type { Project } from "./project.ts";

export function projectBom(project: Project) {
  const parts = new Map(
    project.manufacturerParts.map((part) => [part.id, part]),
  );
  return project.devices.map((device) => ({
    id: device.id,
    reference: device.reference,
    name: device.name,
    partNumber: device.partId
      ? (parts.get(device.partId)?.partNumber ?? "")
      : "",
    quantity: 1,
  }));
}

export function drawingIndex(project: Project) {
  const documents = new Map(
    project.documents.map((document) => [document.id, document.name]),
  );
  return [...project.pages]
    .sort((a, b) => a.order - b.order)
    .map((page) => [
      documents.get(page.documentId) ?? "",
      page.name,
      page.widthMm,
      page.heightMm,
    ]);
}

export function reportCsv(rows: readonly (readonly (string | number)[])[]) {
  return (
    "\uFEFF" +
    rows
      .map((row) =>
        row
          .map((value) => {
            if (typeof value === "number") return String(value);
            const safe = /^[\s\uFEFF]*[=+@-]|^[\t\r\n]/u.test(value)
              ? "'" + value
              : value;
            return '"' + safe.replace(/"/g, '""') + '"';
          })
          .join(","),
      )
      .join("\r\n") +
    "\r\n"
  );
}
