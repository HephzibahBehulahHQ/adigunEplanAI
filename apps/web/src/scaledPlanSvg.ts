import { scaledPlanSize } from "../../../packages/building-design/scale.ts";

export function scaledPlanSvg(source: SVGSVGElement, scale: number): string {
  const size = scaledPlanSize(source.getAttribute("viewBox") ?? "", scale);
  const svg = source.cloneNode(true) as SVGSVGElement;
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("width", `${size.widthMm}mm`);
  svg.setAttribute("height", `${size.heightMm}mm`);
  svg.setAttribute("color", "#111111");
  svg.setAttribute("font-family", "Arial, sans-serif");
  svg.removeAttribute("class");
  svg.removeAttribute("style");
  svg.removeAttribute("tabindex");
  for (const element of svg.querySelectorAll("[tabindex], [role=button]")) {
    element.removeAttribute("tabindex");
    if (element.getAttribute("role") === "button")
      element.removeAttribute("role");
  }
  const description = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "desc",
  );
  description.textContent = `AdigunEplanAI floor plan. Scale 1:${scale}. Model coordinates in millimetres. Print at actual size; fitting to a page changes the scale.`;
  svg.prepend(description);
  return new XMLSerializer().serializeToString(svg);
}
