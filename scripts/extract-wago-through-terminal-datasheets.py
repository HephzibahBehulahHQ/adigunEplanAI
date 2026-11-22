"""Extract reviewable native through-terminal rows from exact WAGO PDFs."""

import argparse
import hashlib
import json
import re
import sys
from contextlib import closing
from datetime import date
from pathlib import Path

import pypdfium2
from pypdfium2.raw import FPDF_PAGEOBJ_IMAGE


NUMBER = r"([0-9]+(?:[.,][0-9]+)?)"
FINISHES = {"gray", "orange", "red", "blue", "black", "yellow"}

# Reviewed WAGO diagrams. Open circles are clamps; filled dots are junctions.
ISOLATED_DECK_DIAGRAMS = {
    "561bf95cb1439fa66782b0f9f01d974f049e871d6c770d135e3481e42bce8168": (2, 2),
    "28cb8bd8c9e2ef90855bd62ea38038d618511ef51ae8d73ea7e31c27a70616fa": (4, 4),
    "bb7e3873a589939b50b7503debafeb0a200c0166d324be6f0de0cb4fe81e030d": (2, 2),
}


def evidence(pages, pattern, label):
    matches = [
        (index, match.group(1))
        for index, text in enumerate(pages, 1)
        for match in re.finditer(pattern, text, re.MULTILINE)
    ]
    if len({value for _, value in matches}) != 1:
        raise ValueError(f"missing or conflicting {label}")
    return matches[0]


def read_article(pdf, candidate, retrieved_at):
    code = pdf.stem
    double_deck = bool(re.fullmatch(r"(?:2000|2002|2200|2202)-2[0-9]{3}", code))
    if not double_deck and not re.fullmatch(r"(?:2000|2004|2006|2010|2016|2204|2206)-1[234]0[1-6]", code):
        raise ValueError("unsupported order code")
    with pypdfium2.PdfDocument(pdf) as document:
        pages = []
        for index in range(3):
            with closing(document[index]) as page, closing(page.get_textpage()) as text:
                pages.append(text.get_text_range().replace("\r", "").replace("\xa0", " "))
        diagram_hash = None
        if double_deck:
            with closing(document[0]) as cover:
                diagrams = [
                    hashlib.sha256(image.get_data()).hexdigest()
                    for image in cover.get_objects(filter=[FPDF_PAGEOBJ_IMAGE])
                    if image.get_px_size() == (1370, 1157)
                ]
            if len(diagrams) != 1 or diagrams[0] not in ISOLATED_DECK_DIAGRAMS:
                raise ValueError("no reviewed diagram proving two isolated clamp groups")
            diagram_hash = diagrams[0]

    product_text = " ".join(pages[0].replace("\ufffe", "").split()).lower()
    if (
        candidate["manufacturer"] != "WAGO"
        or candidate["datasheetUrl"] != f"https://wago.priintcloud.com/datasheets/{code}/en"
        or not all(f"Item Number: {code}" in page for page in pages)
        or "through terminal block" not in product_text
        or "push-in cage clamp" not in product_text
        or "35 x 15 and 35 x 7.5" not in product_text
    ):
        raise ValueError("exact identity or supported mounting and device type missing")

    revision = evidence(pages, r"Version (\d{2}\.\d{2}\.\d{4})", "version")
    clamps = evidence(pages, r"^Clamping units ([2348])\b", "clamp count")
    potential = evidence(pages, r"^Total number of potentials (\d+)\b", "potential count")
    levels = evidence(pages, r"^Number of levels (\d+)\b", "level count")
    actuation = evidence(pages, r"^Actuation (?:type|Method) (Operating tool|Push-button)\b", "actuation")
    expected_actuation = "Push-button" if code.startswith("22") else "Operating tool"
    if actuation[1] != expected_actuation:
        raise ValueError("actuation does not match the supported series")
    nominal = evidence(pages, rf"^Nominal cross-section {NUMBER} mm", "conductor section")
    width = evidence(pages, rf"^Width {NUMBER} mm", "width")
    height = evidence(pages, rf"^Height {NUMBER} mm", "height")
    depth = evidence(
        pages, rf"^Depth from upper-edge of DIN-rail {NUMBER} mm", "depth above the rail"
    )
    finish = evidence(pages, r"^Color ([a-z]+)[ \t]*$", "housing color")
    if (
        finish[1] not in FINISHES
        or not candidate["description"].endswith(";" + finish[1])
        or width[0] != height[0]
        or width[0] != depth[0]
    ):
        raise ValueError("clamping, geometry or finish conflicts with supported family")

    deck_fields = {}
    if double_deck:
        positions = list(ISOLATED_DECK_DIAGRAMS[diagram_hash])
        cover_marking = re.search(r"; ([ln]/[ln]);", product_text)
        markings = set(re.findall(r"^Potential marking ([LN]/[LN])\b", "\n".join(pages), re.MULTILINE))
        if cover_marking:
            markings.add(cover_marking[1].upper())
        marker = re.search(r"\b(without|with) marker carri(?:er|- er)\b", product_text)
        if (
            "through/through terminal block" not in product_text
            or potential[1] != "2"
            or levels[1] != "2"
            or sum(positions) != int(clamps[1])
            or "internal commoning" in product_text
            or len(markings) > 1
        ):
            raise ValueError("diagram, marking or group totals conflict")
        deck_fields = {
            "connectionDiagramSha256": diagram_hash,
        }
        if marker:
            deck_fields["markerCarrier"] = marker[1] == "with"
        if markings:
            deck_fields["potentialMarking"] = markings.pop()
        slug = "4-conductor-double-deck-terminal-block" if positions == [4, 4] else "double-deck-terminal-block"
    else:
        positions = [int(clamps[1])]
        if potential[1] != "1" or levels[1] != "1" or positions != [int(code[6])]:
            raise ValueError("unsupported single-deck grouping")
        slug = f"{clamps[1]}-conductor-through-terminal-block"

    iec_tables = []
    for page in pages:
        for table in re.finditer(r"IEC/EN 60947-7-1[\s\S]*?Rated current[^\n]+", page):
            iec_tables.append(table.group())
    voltage = evidence(iec_tables, rf"^Nominal voltage {NUMBER} V", "IEC nominal voltage")
    current = evidence(iec_tables, rf"^Rated current {NUMBER} A", "IEC rated current")
    ratings_page = next(index for index, page in enumerate(pages, 1) if iec_tables[0] in page)
    if not all(
        re.search(r"Overvoltage category III\b", table)
        and re.search(r"Pollution degree 3\b", table)
        for table in iec_tables
    ):
        raise ValueError("IEC rating basis is missing")

    def number(field):
        return float(field[1].replace(",", "."))

    evidence_pages = [ratings_page, *(field[0] for field in (clamps, potential, levels, actuation, nominal, width, finish))]
    if double_deck:
        evidence_pages.append(1)
    first, last = min(evidence_pages), max(evidence_pages)
    return {
        "orderCode": code,
        "positions": positions,
        **deck_fields,
        "nominalVoltage": number(voltage),
        "ratedCurrent": number(current),
        "finish": finish[1].capitalize(),
        "actuationMethod": actuation[1],
        "widthMm": number(width),
        "heightMm": number(height),
        "depthMm": number(depth),
        "nominalCrossSectionMm2": number(nominal),
        "revision": revision[1],
        "pages": str(first) if first == last else f"{first}–{last}",
        "dimensionPage": width[0],
        "slug": slug,
        "datasheet": candidate["datasheetUrl"],
        "retrievedAt": retrieved_at,
        "datasheetSha256": hashlib.sha256(pdf.read_bytes()).hexdigest(),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("candidate_jsonl", type=Path)
    parser.add_argument("pdf_directory", type=Path)
    parser.add_argument("--retrieved-at", type=date.fromisoformat, required=True)
    parser.add_argument("--skip-unverified", action="store_true", help="report rejected PDFs to stderr and emit the verified subset")
    args = parser.parse_args()
    candidates = {}
    with args.candidate_jsonl.open(encoding="utf-8") as source:
        for line in source:
            candidate = json.loads(line)
            code = candidate["orderCode"]
            if code in candidates:
                parser.error(f"duplicate candidate code {code}")
            candidates[code] = candidate

    batch = []
    for pdf in sorted(args.pdf_directory.glob("*.pdf")):
        if pdf.stem not in candidates:
            parser.error(f"{pdf.name}: no matching exact catalog candidate")
        try:
            batch.append(read_article(pdf, candidates[pdf.stem], args.retrieved_at.isoformat()))
        except (IndexError, ValueError) as error:
            if not args.skip_unverified:
                parser.error(f"{pdf.name}: {error}")
            print(f"{pdf.name}: {error}", file=sys.stderr)
    if not batch:
        parser.error("no matching source PDFs")
    print(json.dumps(batch, indent=2))


if __name__ == "__main__":
    main()
