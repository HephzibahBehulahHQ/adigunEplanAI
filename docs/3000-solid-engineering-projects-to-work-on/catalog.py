#!/usr/bin/env python3
"""Deterministic planning catalog generator and validator; Python standard library only."""
from pathlib import Path
import argparse
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parent
DOMAINS = json.loads((ROOT / 'domains.json').read_text())
VARIANTS = json.loads((ROOT / 'variants.json').read_text())


def sheets(title, assets, variant):
    a, b, c, d = assets.split(', ')
    mode, requirement, acceptance = variant
    return [
        ('A1', 'Project overview', f'Define {title}; show functional block diagram, scope boundaries and external services.'),
        ('A1', 'Title and revision page', 'Record project ID, owner, author, revision, issue purpose and approval status; mark planning-only until reviewed.'),
        ('A1', 'Contents and drawing register', 'List all 30 sheet identifiers, titles, revisions and document dependencies; update after adding sheets.'),
        ('A1', 'Equipment and device register', f'Assign unique device tags to {assets}; record function, location and verified or unresolved manufacturer data.'),
        ('A1', 'Symbols, terms and potentials', 'Define device abbreviations, original symbols, terminal conventions, L/N/DC potentials, PE and FE distinctions and conductor identification.'),
        ('A1', 'Design basis and calculations register', f'Record country/supply/earthing assumptions, load data, environmental limits and calculation inputs. Variant requirement: {requirement}'),
        ('A2', 'Supply boundary and isolation', f'Draw source interface, upstream/downstream responsibility and lockable isolation for {title}; do not assume earthing or source fault level.'),
        ('A2', 'Protection and supply distribution', f'Show protective-device arrangement feeding {a} and {b}; provide references to cable, fault-loop, disconnection and selectivity calculations.'),
        ('A2', f'Primary circuit — {a}', f'Draw the complete {a} circuit with device tags, pin identities, protective interfaces and labelled off-page connections to A2/007 and A2/015.'),
        ('A2', f'Secondary circuit — {b}', f'Draw the complete {b} circuit; document its relationship to {a}, isolation boundary, terminals and operational dependencies.'),
        ('A2', f'Third circuit — {c}', f'Draw {c}, including supply, returns, switching/sensing interfaces and explicit external-device boundaries.'),
        ('A2', f'Fourth circuit — {d}', f'Draw {d}; identify every command/status terminal and its connection to the other three functional circuits.'),
        ('A2', 'Control and auxiliary power', f'Show separately protected auxiliary power, common returns, separation and enable paths required by {mode.lower()}; omit invented voltage ratings.'),
        ('A2', f'Variant function — {mode}', f'{requirement} Draw the added devices and complete wiring; show which base circuits they command or monitor.'),
        ('A2', 'Variant feedback and fault response', f'Complete the feedback, inhibition, alarm and reset circuits for {mode.lower()}; define de-energised contact states and loss-of-power behaviour.'),
        ('A2', 'Field terminal connections', f'Map every field endpoint for {assets} to terminal strip, terminal number, cable/core and source/destination sheet.'),
        ('A2', 'Cable and conductor schedule', 'List cable IDs, endpoint terminals, core functions, lengths/installation methods, sizing evidence, conductor colours and shield treatment. Identify N blue and PE green/yellow where applicable; never prescribe red universally.'),
        ('A2', 'Earthing, bonding and shields', f'Draw PE continuity, enclosure/door bonds and functional-earth/shield interfaces for {title}; justify any neutral-earth relationship from the declared supply system.'),
        ('A2', 'Interface and connection continuation register', 'Pair every off-page source/destination with net/potential label, cable/core and terminal identity; list reference coordinates and reject unmatched continuations.'),
        ('A2', 'Operating sequence and interlock matrix', f'Document normal enable/disable sequence, all permissives and failures for {mode.lower()}. Acceptance scenario: {acceptance}'),
        ('A3', 'Panel general arrangement', f'Place the internal devices for {assets} and variant additions in a dimensioned enclosure view; explicitly list externally installed equipment.'),
        ('A3', 'Mounting plate and DIN rails', 'Dimension rail, duct, protective-device and controller positions; use sourced dimensions or mark placeholders; maintain service and separation clearances.'),
        ('A3', 'Door layout and operator devices', f'Position labels, isolator handles, indications and operator devices needed for {mode.lower()}; dimension cut-outs and door bonding.'),
        ('A3', 'Terminal-strip physical layout', 'Order terminal strips, PE terminals, separators, bridges and end stops consistently with A2/015; reserve and label spare positions.'),
        ('A3', 'Cable entry and internal routing', 'Show gland plate, cable routes, segregation, bend-radius requirements and shield clamps; map cable IDs to A2/016.'),
        ('A3', 'Assembly and installation instructions', f'Provide mounting sequence, external installation boundaries, manufacturer torque sources, thermal/loss calculation requirements and inspection points for {title}.'),
        ('A4', 'Final bill of materials', 'Reconcile all A1/A2/A3 tags, quantities, accessories and source references; distinguish generic selections from verified order codes.'),
        ('A4', 'Final connection and cable reports', 'Generate reconciled device, terminal, cable/core and cross-reference reports; record zero unexplained duplicate tags or unmatched endpoints.'),
        ('A4', 'Inspection and commissioning plan', f'List pre-energisation checks, applicable electrical tests, expected outcomes and evidence fields. Functional test: {acceptance} Record results only after actual testing.'),
        ('A4', 'Handover and unresolved-items register', 'Summarise operation, maintenance/isolation, as-built revisions, calculation evidence, training and outstanding approvals; preserve planning-only status until all release gates pass.'),
    ]


def project(di, si, vi, slug, system):
    number = di * 300 + si * 30 + vi + 1
    pid = f'ENG-{number:04d}'
    name, assets = system
    variant = VARIANTS[vi]
    title = f'{name} — {variant[0]}'
    path = f'projects/{slug}/{pid}.md'
    intro = f'# {pid} — {title}\n\nStatus: **planned; not an implemented, tested or installation-approved design**.\n\nDomain: {DOMAINS[slug][0]}. Base system: {name}.\n\nEngineering scope: {assets}.\n\nDistinct requirement: {variant[1]}\n\nFunctional acceptance: {variant[2]}\n\nUse one native project, four section containers, and the 30 sheets below. Engineering assumptions must be explicit; add sheets when complexity requires them. Read [the handoff](../../NEXT_AGENT.md) before implementation.\n\n| Sheet | Title | Required content |\n| --- | --- | --- |\n'
    rows = sheets(title, assets, variant)
    body = ''.join(f'| {section}/{n:03d} | {label} | {content} |\n' for n, (section, label, content) in enumerate(rows))
    return {'id': pid, 'title': title, 'domain': slug, 'baseSystem': name, 'variant': variant[0], 'path': path, 'sheetCount': 30, 'status': 'planned'}, intro + body


def generate(slug):
    di = list(DOMAINS).index(slug)
    records = []
    for si, system in enumerate(DOMAINS[slug][1]):
        for vi in range(len(VARIANTS)):
            record, content = project(di, si, vi, slug, system)
            target = ROOT / record['path']
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(content)
            records.append(record)
    (ROOT / 'indexes').mkdir(exist_ok=True)
    (ROOT / f'indexes/{slug}.json').write_text(json.dumps(records, indent=2) + '\n')


def validate(complete=False):
    assert len(DOMAINS) == 10 and len(VARIANTS) == 30
    assert all(len(value[1]) == 10 for value in DOMAINS.values())
    assert len({s[0] for v in DOMAINS.values() for s in v[1]}) == 100
    assert len({v[0] for v in VARIANTS}) == 30
    expected = {}
    titles = set()
    for di, (slug, (_, systems)) in enumerate(DOMAINS.items()):
        records = []
        for si, system in enumerate(systems):
            for vi in range(30):
                record, content = project(di, si, vi, slug, system)
                assert record['title'] not in titles
                titles.add(record['title'])
                expected[record['path']] = content
                records.append(record)
        index = ROOT / f'indexes/{slug}.json'
        if index.exists():
            assert json.loads(index.read_text()) == records, f'Index mismatch: {slug}'
            for record in records:
                target = ROOT / record['path']
                assert target.is_file() and target.read_text() == expected[record['path']], f'Missing or changed project: {target}'
        else:
            assert not complete, f'Missing domain: {slug}'
    actual = list(ROOT.glob('projects/*/*.md'))
    for path in actual:
        rel = path.relative_to(ROOT).as_posix()
        assert rel in expected and path.read_text() == expected[rel], f'Unexpected project content: {rel}'
        refs = re.findall(r'^\| (A[1-4]/\d{3}) \|', path.read_text(), re.M)
        wanted = [f'{s}/{n:03d}' for n, (s, _, _) in enumerate(sheets('sample', 'a, b, c, d', VARIANTS[0]))]
        assert refs == wanted, f'Invalid sheet numbering: {rel}'
    if complete:
        assert len(actual) == 3000
    print(json.dumps({'projects': len(actual), 'sheets': len(actual) * 30, 'targetProjects': 3000, 'complete': len(actual) == 3000}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--generate', choices=list(DOMAINS) + ['all'])
    parser.add_argument('--complete', action='store_true')
    args = parser.parse_args()
    if args.generate:
        for domain in DOMAINS if args.generate == 'all' else [args.generate]:
            generate(domain)
    validate(args.complete)
