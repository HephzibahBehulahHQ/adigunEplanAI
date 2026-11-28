const root = document.documentElement;
const overview = document.querySelector<HTMLElement>("#studioOverview")!;
const studio = document.querySelector<HTMLElement>("#app")!;
const preview = document.querySelector<HTMLCanvasElement>("#studioPreview")!;
const field = document.querySelector<HTMLCanvasElement>("#studioTelemetry")!;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

let frame = 0;
let studioRuntime: Promise<unknown> | undefined;
let presetObserver: MutationObserver | undefined;

function paint(canvas: HTMLCanvasElement, time: number, schematic: boolean) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!width || !height) return;
  const density = Math.min(devicePixelRatio || 1, 2);
  if (
    canvas.width !== Math.round(width * density) ||
    canvas.height !== Math.round(height * density)
  ) {
    canvas.width = Math.round(width * density);
    canvas.height = Math.round(height * density);
  }
  const context = canvas.getContext("2d");
  if (!context) return;
  context.setTransform(density, 0, 0, density, 0, 0);
  context.clearRect(0, 0, width, height);
  context.strokeStyle = "#6589c626";
  context.beginPath();
  for (let x = 0; x < width; x += 24) {
    context.moveTo(x, 0);
    context.lineTo(x, height);
  }
  for (let y = 0; y < height; y += 24) {
    context.moveTo(0, y);
    context.lineTo(width, y);
  }
  context.stroke();

  if (!schematic) {
    for (let i = 1; i <= 32; i++) {
      const x = (i * 137 + time / (44 + i)) % width;
      const y = (i * 107) % height;
      context.fillStyle = i % 2 ? "#79faff55" : "#9d7bff77";
      context.fillRect(x, y, 2, 2);
    }
    return;
  }

  const left = width * 0.19,
    right = width * 0.81,
    y = height * 0.56;
  context.strokeStyle = "#80f9ed";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(left, y);
  context.lineTo(right, y);
  context.stroke();
  for (const [x, label] of [
    [left, "X1 · 1"],
    [right, "H1 · X1"],
  ] as const) {
    context.beginPath();
    context.arc(x, y, 6, 0, 2 * Math.PI);
    context.fillStyle = "#b4fff7";
    context.fill();
    context.font = "12px monospace";
    context.textAlign = "center";
    context.fillText(label, x, y - 18);
  }
  context.fillStyle = "#bda4ff";
  context.fillRect(left + ((right - left) * (time % 2400)) / 2400, y - 3, 6, 6);
}

function animate(time: number) {
  paint(field, time, false);
  paint(preview, time, true);
  if (!reducedMotion.matches) frame = requestAnimationFrame(animate);
}

function offerPreset(preset: string) {
  const open = () => {
    if (studio.inert) return false;
    const field = document.querySelector<HTMLSelectElement>("#projectTemplate");
    const trigger = studio.querySelector<HTMLButtonElement>(
      '[data-action="new"]',
    );
    if (
      !field ||
      !trigger ||
      !Array.from(field.options).some((option) => option.value === preset)
    )
      return true;
    trigger.click();
    field.value = preset;
    field.dispatchEvent(new Event("change"));
    return true;
  };
  if (open()) return;
  presetObserver = new MutationObserver(() => {
    if (open()) presetObserver?.disconnect();
  });
  presetObserver.observe(studio, {
    attributes: true,
    attributeFilter: ["inert"],
  });
}

function switchView() {
  const inStudio =
    location.hash === "#studio" || location.hash.startsWith("#studio/");
  root.toggleAttribute("data-studio", inStudio);
  presetObserver?.disconnect();
  cancelAnimationFrame(frame);
  if (inStudio) {
    studioRuntime ??= import("./copiedInterfaceAccount").catch((error) => {
      studioRuntime = undefined;
      const notice = document.querySelector("#eplan-account-root");
      if (notice)
        notice.textContent =
          "Studio could not load. Return to the overview and try again.";
      console.error(error);
    });
    const preset = location.hash.slice("#studio/".length);
    if (["indicator", "eng0601"].includes(preset)) offerPreset(preset);
  } else {
    for (const dialog of document.querySelectorAll<HTMLDialogElement>(
      "dialog[open]",
    ))
      dialog.close();
    window.scrollTo({ top: 0 });
    frame = requestAnimationFrame(animate);
  }
}

document
  .querySelector("#backToOverview")
  ?.addEventListener("click", (event) => {
    event.preventDefault();
    history.pushState(null, "", location.pathname + location.search);
    switchView();
    overview.querySelector<HTMLElement>('a[href="#studio"]')?.focus();
  });
window.addEventListener("hashchange", switchView);
switchView();
