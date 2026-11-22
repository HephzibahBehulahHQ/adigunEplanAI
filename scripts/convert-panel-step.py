#!/usr/bin/env python3
"""Convert AdigunEplanAI panel solid envelopes and verify STEP readback with OCCT."""

import argparse
import json
import math
import os
from pathlib import Path
import shutil
import subprocess
import tempfile


def read_solids(path):
    if path.stat().st_size > 8_000_000:
        raise ValueError("Panel solid input exceeds 8 MB")
    manifest = json.loads(path.read_text(encoding="utf-8"))
    if manifest["schema"] != "adiguneplanai-panel-solids/1" or manifest["units"] != "mm":
        raise ValueError("Expected a version 1 panel solid export in millimetres")
    solids = manifest["solids"]
    if not isinstance(solids, list) or not 1 <= len(solids) <= 5000:
        raise ValueError("Expected 1 to 5000 solid envelopes")
    bounds = []
    for solid in solids:
        extents = tuple(solid["bounds"][edge][axis] for edge in ("min", "max") for axis in "xyz")
        if any(type(n) not in (int, float) or not math.isfinite(n) or abs(n) > 1e7 for n in extents):
            raise ValueError("Each coordinate must be finite and within 10,000,000 mm")
        if any(extents[i + 3] - extents[i] <= 1e-6 for i in range(3)):
            raise ValueError("Each solid needs three dimensions exceeding 0.000001 mm")
        bounds.append(extents)
    return bounds


def draw(executable, script, folder):
    result = subprocess.run(
        [executable, "-b", "-f", script.name], cwd=folder, text=True,
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=180, check=True,
    )
    if "ADIGUN_DRAW_OK" not in result.stdout.splitlines():
        raise RuntimeError(result.stdout[-2500:].strip() or "Open CASCADE did not complete the operation")
    return result.stdout


def convert(source, destination, executable):
    bounds = read_solids(source)
    with tempfile.TemporaryDirectory(prefix="adigun-step-") as folder:
        folder = Path(folder)
        writer = folder / "write.tcl"
        commands = ["pload ALL", "XNewDoc model"]
        for index, box in enumerate(bounds):
            dimensions = tuple(box[i + 3] - box[i] for i in range(3))
            arguments = " ".join(format(n, ".17g") for n in (*box[:3], *dimensions))
            commands.extend([f"box part{index} {arguments}", f"XAddShape model part{index}"])
        commands.extend([
            "param write.step.unit MM", "WriteStep model panel.step",
            "if {![file exists panel.step]} { error {STEP writer did not produce a file} }",
            "puts ADIGUN_DRAW_OK",
        ])
        writer.write_text("\n".join(commands), encoding="utf-8")
        draw(executable, writer, folder)
        reader = folder / "read.tcl"
        reader.write_text("""pload ALL
ReadStep reopened panel.step
XGetOneShape model reopened
if {![string match -nocase {*seems to be valid*} [checkshape model]]} { error {Invalid imported shape} }
set parts [explode model so]
if {[llength $parts] == 0} { set parts model }
foreach part $parts {
    bounding $part -optimal -save xmin ymin zmin xmax ymax zmax
    puts "ADIGUN_BOUNDS [dval xmin] [dval ymin] [dval zmin] [dval xmax] [dval ymax] [dval zmax]"
}
puts ADIGUN_DRAW_OK
""", encoding="utf-8")
        report = draw(executable, reader, folder)
        imported = [tuple(map(float, line.split()[1:])) for line in report.splitlines() if line.startswith("ADIGUN_BOUNDS ")]
        if len(imported) != len(bounds) or any(
            len(actual) != 6 or any(not math.isclose(a, b, abs_tol=1e-6, rel_tol=1e-10) for a, b in zip(actual, expected))
            for actual, expected in zip(sorted(imported), sorted(bounds))
        ):
            raise ValueError("STEP readback does not match the exported solid bounds")
        with (folder / "panel.step").open("rb") as step, destination.open("xb") as output:
            shutil.copyfileobj(step, output)
    return len(bounds)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    parser.add_argument("--draw", default=os.environ.get("ADIGUN_OCCT_DRAW") or shutil.which("occt-draw") or shutil.which("DRAWEXE"))
    args = parser.parse_args()
    if not args.draw:
        parser.error("Open CASCADE DRAW is required. Set --draw to its executable.")
    if args.destination.exists():
        parser.error("Destination already exists")
    try:
        count = convert(args.source, args.destination, args.draw)
    except (OSError, KeyError, TypeError, ValueError, RuntimeError, subprocess.SubprocessError) as error:
        parser.exit(1, f"STEP conversion failed: {error}\n")
    print(f"Verified {count} STEP solids in millimetres: {args.destination}")


if __name__ == "__main__":
    main()
