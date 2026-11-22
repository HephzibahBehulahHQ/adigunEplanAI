"""Extract reviewable native through-terminal rows from exact WAGO PDFs."""

import argparse
import hashlib
import json
import re
from contextlib import closing
from datetime import date
from pathlib import Path

import pypdfium2


NUMBER = r"([0-9]+(?:[.,][0-9]+)?)"
FINISHES = {"gray", "orange", "red", "blue", "black", "yellow"}


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
    if not re.fullmatch(r"(?:2000|2004|2006|2010|2016)-1[234]0[1-6]", code):
        raise ValueError("unsupported order code")
    with pypdfium2.PdfDocument(pdf) as document:
        pages = []
        for index in range(3):
            with closing(document[index]) as page, closing(page.get_textpage()) as text:
                pages.append(text.get_text_range().replace("\r", "").replace("\xa0", " "))

    product_text = " ".join(pages[0].split()).lower()
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
    clamps = evidence(pages, r"^Clamping units ([234])\b", "clamp count")
    potential = evidence(pages, r"^Total number of potentials (\d+)\b", "potential count")
    levels = evidence(pages, r"^Number of levels (\d+)\b", "level count")
    actuation = evidence(pages, r"^Actuation (?:type|Method) (Operating tool)\b", "actuation")
    nominal = evidence(pages, rf"^Nominal cross-section {NUMBER} mm", "conductor section")
    width = evidence(pages, rf"^Width {NUMBER} mm", "width")
    height = evidence(pages, rf"^Height {NUMBER} mm", "height")
    depth = evidence(
        pages, rf"^Depth from upper-edge of DIN-rail {NUMBER} mm", "depth above the rail"
    )
    finish = evidence(pages, r"^Color ([a-z]+)[ \t]*$", "housing color")
    if (
        potential[1] != "1"
        or levels[1] != "1"
        or int(clamps[1]) != int(code[6])
        or finish[1] not in FINISHES
        or not candidate["description"].endswith(";" + finish[1])
        or width[0] != height[0]
        or width[0] != depth[0]
    ):
        raise ValueError("clamping, geometry or finish conflicts with supported family")

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
    first, last = min(evidence_pages), max(evidence_pages)
    return {
        "orderCode": code,
        "positions": [int(clamps[1])],
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
        "slug": f"{clamps[1]}-conductor-through-terminal-block",
        "datasheet": candidate["datasheetUrl"],
        "retrievedAt": retrieved_at,
        "datasheetSha256": hashlib.sha256(pdf.read_bytes()).hexdigest(),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("candidate_jsonl", type=Path)
    parser.add_argument("pdf_directory", type=Path)
    parser.add_argument("--retrieved-at", type=date.fromisoformat, required=True)
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
            parser.error(f"{pdf.name}: {error}")
    if not batch:
        parser.error("no matching source PDFs")
    print(json.dumps(batch, indent=2))


if __name__ == "__main__":
    main()
