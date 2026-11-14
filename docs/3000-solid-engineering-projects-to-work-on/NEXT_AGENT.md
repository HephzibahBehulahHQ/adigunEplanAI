# Next-agent continuation instructions

## Scope and authority

Read root AGENTS.md, docs/ACTIVE_ENGINEERING_GOAL.md and the electrical scope in docs/MASTER_SPECIFICATION.md. Current owner request creates a 3,000-project planning library. Preserve the approved interface and existing functional examples. This delivery does not claim 3,000 working native projects.

## Start here

1. Run `python3 docs/3000-solid-engineering-projects-to-work-on/catalog.py --complete`. A partial batch can be checked without `--complete`.
2. Select an ID from a domain index. Read its project file and all thirty sheet requirements. Do not ask the owner to choose an inverter model merely because an inverter was used as a structural example.
3. Inspect the existing project/sheet/persistence model. Implement the default four-container template through existing Create New Project and Add Sheet controls; this documentation alone does not implement that application behaviour.
4. Research the chosen project's engineering requirements and primary manufacturer documentation. Make coherent educational assumptions, record their provenance and distinguish unresolved installation inputs. Never invent a verified specification.
5. Create one native project with stable identity; populate A1, then A2, A3 and A4 with the actual content described. Expand beyond thirty sheets when needed. Do not substitute title-only empty pages.
6. Implement the selected variant's distinct requirements and acceptance scenario. Do not count renamed copies as independent validated examples.
7. Produce continuity evidence for terminals/nets, cross-sheet links, device/cable identity, protection/cable calculations where applicable, BOM reconciliation, panel/external distinction and native save/reopen.
8. Test through existing UI controls, review source/standards assumptions, record limitations and publish small verified PRs using the existing CI and Pages workflow. Preserve unrelated work.

## Per-project work record

Create a separate implementation record outside the generated planning files, keyed by ENG ID. Record native file path, selected hardware/source URLs, assumptions, calculation evidence, sheet-by-sheet completion, test command/results, actual unresolved endpoints, review status, commit/PR and deployment URL. Use planned → in-progress → implemented → tested → reviewed; never set tested merely because a planning file exists.

## Planning layout

`domains.json` contains 100 base systems. `variants.json` contains 30 explicit requirement/acceptance packages. `catalog.py` expands them deterministically into 3,000 briefs with 90,000 sheet requirements and validates indexes/content/numbering. Each brief is a separate small Markdown file. Domain indexes have 300 entries each. Generated briefs should be regenerated from sources, rather than edited ad hoc.

## Boundaries

Safety-rated functions, fire protection interfaces, medical installations, grid connections, protection coordination and earthing require applicable specialist review. An ordinary operational interlock is not a safety-rated function. No simulation, installation approval, standards compliance or real-world test success is implied by this planning catalog.

Await the owner's next instruction after delivering this catalog; do not begin implementing all 3,000 projects automatically.
