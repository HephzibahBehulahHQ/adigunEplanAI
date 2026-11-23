"""Extract reviewable native terminal rows from exact WAGO PDFs."""

import argparse
import hashlib
import json
import re
import sys
from contextlib import closing
from datetime import date
from pathlib import Path

import pypdfium2
from PIL import ImageOps
from pypdfium2.raw import FPDF_PAGEOBJ_IMAGE


NUMBER = r"([0-9]+(?:[.,][0-9]+)?)"
FINISHES = {"gray", "orange", "red", "blue", "black", "yellow"}

# Reviewed WAGO diagrams. Open circles are clamps; filled dots are junctions.
ISOLATED_DECK_DIAGRAMS = {
    "561bf95cb1439fa66782b0f9f01d974f049e871d6c770d135e3481e42bce8168": (2, 2),
    "28cb8bd8c9e2ef90855bd62ea38038d618511ef51ae8d73ea7e31c27a70616fa": (4, 4),
    "bb7e3873a589939b50b7503debafeb0a200c0166d324be6f0de0cb4fe81e030d": (2, 2),
}


# Drawings dimension the interleaved rows 5 mm apart and identify the first pad.
STAGGERED_PCB_DRAWINGS = {
    "c152e6f267c1ddd76ec1d0210c47861dcf329cd09ba5993a4b70571c0ab9715f": (3.5, 5),
    "71fe602df5fe38ed975589be07c9819ffe726582359b0e6974d7cac5b6f8fabb": (2.5, 5),
    "88ba609cc3b79eac09016983aadd19c25d208dac924ac4493806f6d11f51684a": (2.54, 5),
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


def read_pcb_article(pdf, candidate, retrieved_at):
    code = candidate["orderCode"]
    url_code = code.replace("/", "_")
    with pypdfium2.PdfDocument(pdf) as document:
        pages = [
            document[index].get_textpage().get_text_range().replace("\r", "").replace("\xa0", " ")
            for index in range(3)
        ]
    if (
        candidate["manufacturer"] != "WAGO"
        or url_code != pdf.stem
        or candidate["datasheetUrl"] != f"https://wago.priintcloud.com/datasheets/{url_code}/en"
        or candidate["productUrl"] != f"https://www.wago.com/{url_code}"
        or not candidate["description"].startswith("PCB terminal block;")
        or not all(re.search(rf"Item Number: {re.escape(code)}(?:\s|$)", page) for page in pages)
    ):
        raise ValueError("source does not identify this PCB terminal block")

    def field(pattern, name):
        return evidence(pages, pattern, name)

    def value(item):
        return float(item[1].replace(",", "."))

    clamps = field(r"^Clamping units (\d+)\b", "clamp count")
    poles = field(r"^Total number of potentials (\d+)\b", "potential count")
    levels = field(r"^Number of levels (\d+)\b", "level count")
    pins = field(r"^Number of solder pins per potential (\d+)\b", "solder pins per potential")
    technology = field(r"^Connection technology (Push-in CAGE CLAMP|CAGE CLAMP)\b", "connection technology")
    actuation = field(r"^Actuation (?:type|Method) (Push-button)\b", "actuation")
    mounting = field(r"^PCB contact (THT)\b", "PCB contact")
    pattern = field(r"^Solder pin arrangement over the entire terminal strip \(?(in-line|staggered)\)?", "pad arrangement")
    pitch = field(rf"^Pin spacing {NUMBER} mm", "single pad pitch")
    width = field(rf"^Width {NUMBER} mm", "width")
    height = field(rf"^Height from the surface {NUMBER} mm", "height above board")
    depth = field(rf"^Depth {NUMBER} mm", "depth")
    length = field(rf"^Solder pin length {NUMBER} mm", "solder pin length")
    drilled = field(rf"^Drilled hole diameter {NUMBER}(?: mm)?[ \t]*$", "drilled hole diameter")
    pin_dimensions = field(r"^Solder pin dimensions ([0-9.,]+ x [0-9.,]+) mm", "pin dimensions")
    finish = field(r"^Color ([a-z]+(?:[ -][a-z]+)*)[ \t]*$", "finish")
    revision = field(r"Version (\d{2}\.\d{2}\.\d{4})", "version")
    title = " ".join(pages[0].replace("\ufffe", "").split())
    section = re.search(rf"PCB terminal block;[^;]*; {NUMBER} mm", title)

    if (
        not section
        or not candidate["description"].endswith(";" + finish[1])
        or not 1 <= int(poles[1]) <= 32
        or clamps[1] != poles[1]
        or levels[1] != "1"
        or pins[1] != "1"
        or (int(poles[1]) - 1) * value(pitch) >= value(width)
    ):
        raise ValueError("source does not document one clamp and one solder pad per pole")

    staggered = {}
    if pattern[1] == "staggered":
        with pypdfium2.PdfDocument(pdf) as document, closing(document[0]) as cover:
            hashes = {
                hashlib.sha256(image.get_data()).hexdigest()
                for image in cover.get_objects(filter=[FPDF_PAGEOBJ_IMAGE])
            }
        reviewed = hashes.intersection(STAGGERED_PCB_DRAWINGS)
        if len(reviewed) != 1:
            raise ValueError("no reviewed staggered-pad drawing")
        diagram_sha = reviewed.pop()
        diagram_pitch, row_spacing = STAGGERED_PCB_DRAWINGS[diagram_sha]
        if value(pitch) != diagram_pitch or row_spacing >= value(depth):
            raise ValueError("staggered drawing conflicts with pad pitch or body depth")
        staggered = {
            "padRowSpacingMm": row_spacing,
            "footprintDrawingSha256": diagram_sha,
        }

    (voltage, current, ratings_page) = iec_ratings(pages, "60664-1")
    last = max(ratings_page, pins[0], width[0], finish[0], mounting[0], pattern[0])
    pin_width, pin_depth = [float(x.replace(",", ".")) for x in pin_dimensions[1].split(" x ")]
    return {
        "orderCode": code,
        "poles": int(poles[1]),
        **staggered,
        "nominalVoltage": value(voltage),
        "ratedCurrent": value(current),
        "finish": finish[1].title(),
        "connectionTechnology": technology[1],
        "actuationMethod": actuation[1],
        "nominalCrossSectionMm2": float(section[1].replace(",", ".")),
        "bodyWidthMm": value(width),
        "bodyDepthMm": value(depth),
        "bodyHeightAboveBoardMm": value(height),
        "padPitchMm": value(pitch),
        "solderPinLengthMm": value(length),
        "solderPinWidthMm": pin_width,
        "solderPinDepthMm": pin_depth,
        "drilledHoleDiameterMm": value(drilled),
        "revision": revision[1],
        "pages": f"1–{last}",
        "dimensionPage": width[0],
        "datasheet": candidate["datasheetUrl"],
        "productUrl": candidate["productUrl"],
        "retrievedAt": retrieved_at,
        "datasheetSha256": hashlib.sha256(pdf.read_bytes()).hexdigest(),
    }


def iec_ratings(pages, standard="60947-7-1"):
    iec_tables = []
    for page in pages:
        for table in re.finditer(rf"IEC/EN {standard}[\s\S]*?Rated current[^\n]+", page):
            iec_tables.append(table.group())
    current = evidence(iec_tables, rf"^Rated current {NUMBER} A", "IEC rated current")
    ratings_page = next(index for index, page in enumerate(pages, 1) if iec_tables[0] in page)
    explicit_basis = r"^Nominal voltage \(III\s*/\s*3\)"
    if all(re.search(explicit_basis, table, re.MULTILINE) for table in iec_tables):
        voltage = evidence(iec_tables, rf"{explicit_basis} {NUMBER} V", "IEC nominal voltage")
    elif all(
        re.search(r"Overvoltage category III\b", table)
        and re.search(r"Pollution degree 3\b", table)
        for table in iec_tables
    ):
        voltage = evidence(iec_tables, rf"^Nominal voltage {NUMBER} V", "IEC nominal voltage")
    else:
        raise ValueError("IEC rating basis is missing")
    return voltage, current, ratings_page


# Reviewed renderings of the protective-earth glyph in WINSTA potential tables.
PE_GLYPHS = set("""
069bf14ceccf 278a501e0a38 3369ee60aa15 41f9fa83d08e 47979d070d8e
4a214ce05c20 5312a5a94e9e 53339a754846 6dd3fa56efbe 71b4c63ffe3e
72c78696b060 81a33142eb46 8c5a116e2555 a5f10920e719 b78d9cf48406
bf9fb3a38736 c22a67a67943 d136c50e2e90 d52ffc4128a5 d6ddf321deb5
d7a95db1bbe9 e4e9fa851356 e639f8e674c9 e678692e73f8 f72f5aeae3b5
ccbbf344574c 0f73decef6db 635096ea810d 6b2283afde1c 212e35edbe23
b9fd3a85883c dc8292ad9573 56e92bd66275 2abd46f0e925 75ba31792972
687456df6073 bb145b6008f2
fa4314463724 c2c92a2e04a0 857c126c22bf
c0f4f8512f63 134c1b487d8c 6befc44c9586 e419ce42df4f 8e4daf2d0da2 71095d6d4c05 5aee1edfc0c4
205f493934a0 d9cd142d6372
""".split())


def read_winsta_markings(document, raw):
    if "\ufffd" not in raw:
        return raw.split()
    hashes = []
    for index in range(3):
        with closing(document[index]) as page, closing(page.get_textpage()) as text:
            search = text.search("Potential marking")
            match = search.get_next()
            if match is None:
                continue
            start, length = match
            for offset in range(start + length, min(start + length + 60, text.count_chars())):
                glyph = text.get_text_range(offset, 1)
                if "\n" in glyph or "\r" in glyph:
                    break
                if glyph != "\ufffd":
                    continue
                left, bottom, right, top = text.get_charbox(offset)
                crop = (left - 1, bottom - 1, page.get_width() - right - 1, page.get_height() - top - 1)
                with closing(page.render(scale=10, crop=crop)) as bitmap:
                    image = bitmap.to_pil().convert("L").point(lambda pixel: 0 if pixel < 160 else 255)
                box = ImageOps.invert(image).getbbox()
                if not box:
                    raise ValueError("potential table glyph is empty")
                hashes.append(hashlib.sha256(image.crop(box).resize((32, 32)).tobytes()).hexdigest())
    if len(hashes) != raw.count("\ufffd") or any(value[:12] not in PE_GLYPHS for value in hashes):
        raise ValueError("potential table contains an unverified glyph")
    return raw.replace("\ufffd", "PE").split()


def read_winsta_article(pdf, candidate, retrieved_at):
    code = candidate["orderCode"]
    url_code = code.replace("/", "_")
    with pypdfium2.PdfDocument(pdf) as document:
        pages = []
        for index in range(3):
            with closing(document[index]) as page, closing(page.get_textpage()) as text:
                pages.append(text.get_text_range().replace("\r", "").replace("\xa0", " "))
        # These reviewed source rows render a literal minus at the field boundary.
        if url_code in {"770-263_071-000", "770-274_071-000", "770-274_072-000", "770-282_080-000", "890-263_071-000", "890-282_080-000"}:
            pages = [re.sub(r"(?<=[A-Z])\ufffe(?=Potential marking|Mating force)", "-\n", page) for page in pages]
        raw_marking = evidence(pages, r"^Potential marking ([^\n]+)", "potential marking")
        marks = read_winsta_markings(document, raw_marking[1].strip())

    title = " ".join(pages[0].replace("\ufffe", "").split())
    if (
        candidate["manufacturer"] != "WAGO"
        or pdf.stem != url_code
        or candidate["datasheetUrl"] != f"https://wago.priintcloud.com/datasheets/{url_code}/en"
        or candidate["productUrl"] != f"https://www.wago.com/{url_code}"
        or not all(re.search(rf"Item Number: {re.escape(code)}(?:\s|$)", page) for page in pages)
        or not re.search(r"WINSTA.{0,4} " + ("MINI" if code.startswith("890-") else "MIDI"), title)
    ):
        raise ValueError("source does not identify this WINSTA part")
    pole_count = re.search(r"\b([2-5])-pole\b", title)
    if not pole_count:
        raise ValueError("source cover lacks a supported pole count")

    def field(pattern, name):
        return evidence(pages, pattern, name)

    def value(item):
        return float(item[1].replace(",", "."))

    poles = int(pole_count[1])
    clamps = int(field(r"^Clamping units (\d+)\b", "clamp count")[1])
    potentials = int(field(r"^Total number of potentials (\d+)\b", "potential count")[1])
    contact = field(r"^Contact type \(pluggable connector\) (Female connector/socket|Male connector/plug)", "connector gender")
    gender = "socket" if contact[1].startswith("Female") else "plug"
    if (
        len(marks) != poles
        or len(set(marks)) != poles
        or any(not re.fullmatch(r"[A-Z0-9/+'-]+", mark) for mark in marks)
        or potentials != poles
        or clamps not in (poles, 2 * poles)
        or not candidate["description"].startswith(gender.capitalize() + ";")
    ):
        raise ValueError("pole marking, clamp count or gender conflict")

    coding = field(r"^Coding ([A-Z])(?=\s|$)", "coding")
    width = field(rf"^Width {NUMBER} mm", "width")
    height = field(rf"^Height {NUMBER} mm", "height")
    depth = field(rf"^Depth {NUMBER} mm", "depth")
    color = field(r"^Color:? ([a-z]+(?:[ /-][a-z]+)*)(?= Similar to illustration|[ \t]*$)", "finish")
    revision = field(r"Version (\d{2}\.\d{2}\.\d{4})", "version")
    technology = field(r"^Connection technology (Push-in CAGE CLAMP)\b", "connection technology")
    voltage, current, ratings_page = iec_ratings(pages, "60664-1")
    return {
        "orderCode": code,
        "gender": gender,
        "coding": coding[1],
        "markings": marks,
        "clampsPerPole": clamps // poles,
        "nominalVoltage": value(voltage),
        "ratedCurrent": value(current),
        "finish": color[1].title(),
        "connectionTechnology": technology[1],
        "widthMm": value(width),
        "heightMm": value(height),
        "depthMm": value(depth),
        "revision": revision[1],
        "pages": f"1–{max(contact[0], width[0], raw_marking[0], ratings_page)}",
        "dimensionPage": width[0],
        "datasheet": candidate["datasheetUrl"],
        "productUrl": candidate["productUrl"],
        "retrievedAt": retrieved_at,
        "datasheetSha256": hashlib.sha256(pdf.read_bytes()).hexdigest(),
    }


def read_article(pdf, candidate, retrieved_at):
    code = pdf.stem
    if re.fullmatch(r"(?:770|890)-[0-9]{3}(?:_[0-9]{3}-[0-9]{3}){0,3}", code):
        return read_winsta_article(pdf, candidate, retrieved_at)
    if re.fullmatch(r"250-[0-9]{3,4}(?:_[0-9]{3}-[0-9]{3})?", code):
        return read_pcb_article(pdf, candidate, retrieved_at)
    double_deck = bool(re.fullmatch(r"(?:2000|2002|2200|2202)-2[0-9]{3}", code))
    classic = bool(re.fullmatch(r"(?:279|280|281|282|285)-[0-9]{3}", code))
    if not double_deck and not classic and not re.fullmatch(r"(?:2000|2004|2006|2010|2016|2204|2206)-1[234]0[1-6]", code):
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
    rail = None
    if "35 x 15 and 35 x 7.5" in product_text:
        rail = "DIN rail 35 × 7.5 or 35 × 15 mm"
    elif re.search(r"only for din(?:-rail)? 35 x 15(?: mm)? rail", product_text):
        rail = "DIN rail 35 × 15 mm only"
    if (
        candidate["manufacturer"] != "WAGO"
        or candidate["datasheetUrl"] != f"https://wago.priintcloud.com/datasheets/{code}/en"
        or not all(f"Item Number: {code}" in page for page in pages)
        or "through terminal block" not in product_text
        or "cage clamp" not in product_text
        or not rail
        or (not classic and "push-in cage clamp" not in product_text)
    ):
        raise ValueError("exact identity or supported mounting and device type missing")

    revision = evidence(pages, r"Version (\d{2}\.\d{2}\.\d{4})", "version")
    clamps = evidence(pages, r"^Clamping units ([2348])\b", "clamp count")
    potential = evidence(pages, r"^Total number of potentials (\d+)\b", "potential count")
    levels = evidence(pages, r"^Number of levels (\d+)\b", "level count")
    actuation = evidence(pages, r"^Actuation (?:type|Method) (Operating tool|Push-button|T-wrench; [0-9]+ mm)\b", "actuation")
    expected_actuation = "Push-button" if code.startswith("22") else "Operating tool"
    if actuation[1] != expected_actuation and not (classic and actuation[1].startswith("T-wrench;")):
        raise ValueError("actuation does not match the supported series")
    classic_fields = {}
    if classic:
        technology = evidence(pages, r"^Connection technology ((?:POWER )?CAGE CLAMP)\b", "connection technology")
        title = re.search(rf"\b([234])-conductor through terminal block; {NUMBER} mm", product_text)
        candidate_section = re.search(rf";{NUMBER} mm", candidate["description"])
        if (
            not title
            or int(title[1]) != int(clamps[1])
            or not candidate_section
            or float(title[2].replace(",", ".")) != float(candidate_section[1].replace(",", "."))
        ):
            raise ValueError("title and catalog clamping or conductor section conflict")
        nominal = (1, title[2])
        if any(re.match(r"^Nominal cross-section ", line) for text in pages for line in text.splitlines()):
            actual_nominal = evidence(pages, rf"^Nominal cross-section {NUMBER} mm", "conductor section")
            if float(actual_nominal[1].replace(",", ".")) != float(nominal[1].replace(",", ".")):
                raise ValueError("nominal conductor section conflicts with connection table")
        classic_fields = {"connectionTechnology": technology[1], "mounting": rail}
    else:
        nominal = evidence(pages, rf"^Nominal cross-section {NUMBER} mm", "conductor section")
    width = evidence(pages, rf"^Width {NUMBER} mm", "width")
    height = evidence(pages, rf"^Height {NUMBER} mm", "height")
    depth = evidence(
        pages, rf"^Depth from upper-edge of DIN-rail {NUMBER} mm", "depth above the rail"
    )
    finish = evidence(pages, r"^Color ([a-z]+(?:[ /-][a-z]+)*)[ \t]*$", "housing color")
    finish_name = finish[1]
    candidate_finish = candidate["description"].rsplit(";", 1)[-1]
    if (
        (not classic and finish_name not in FINISHES)
        or candidate_finish.replace("/", "-") != finish_name.replace("/", "-")
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
        if potential[1] != "1" or levels[1] != "1" or (not classic and positions != [int(code[6])]):
            raise ValueError("unsupported single-deck grouping")
        slug = f"{clamps[1]}-conductor-through-terminal-block"

    voltage, current, ratings_page = iec_ratings(pages)

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
        **classic_fields,
        "nominalVoltage": number(voltage),
        "ratedCurrent": number(current),
        "finish": finish_name.title() if classic else finish_name.capitalize(),
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
            code = candidate["orderCode"].replace("/", "_")
            if code in candidates:
                parser.error(f"duplicate candidate code {code}")
            candidates[code] = candidate

    batch = []
    for pdf in sorted(args.pdf_directory.glob("*.pdf")):
        if pdf.stem not in candidates:
            parser.error(f"{pdf.name}: no matching exact catalog candidate")
        try:
            batch.append(read_article(pdf, candidates[pdf.stem], args.retrieved_at.isoformat()))
        except (IndexError, ValueError, pypdfium2.PdfiumError) as error:
            if not args.skip_unverified:
                parser.error(f"{pdf.name}: {error}")
            print(f"{pdf.name}: {error}", file=sys.stderr)
    if not batch:
        parser.error("no matching source PDFs")
    print(json.dumps(batch, indent=2))


if __name__ == "__main__":
    main()
