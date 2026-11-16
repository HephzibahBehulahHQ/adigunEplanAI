# LAPP four-core cable library increment — local, unpublished

Primary source: https://www.lapp.com/en/be/oelflex-classic-110/p/1119504, reviewed 2026-11-15. Verified 1119504 / OLFLEX CLASSIC 110 4G4: four 4mm² cores including PE, numbered identification, PVC, U0/U 300/500V; fixed installation / occasional movement without tensile strain, dry/damp spaces. No installation ampacity, bend radius, fault withstand, length or route claimed.

Added lapp-1119504 component to existing catalog, family multicore-cable. Eight model-local A/B core endpoints, four isolated internal core paths; schematic coordinates not physical routing. Editable route, lengthAssumption and comment; manufacturer definition frozen. Existing renderer draws four core paths and cable body with dedicated reference placement. No CSS/menu/layout changes. Not inserted into ENG0601 yet: field enclosure PE bypass/termination must be coordinated first.

38 focused tests pass including isolated paths with attached leads, rotated edit/save/reopen and unchanged manufacturer definition. Initial test fixture errors fixed (createInstance positional signature; analyzer requires wired pins; project sheets array required). Full check and browser insertion/visual review pending. Local source is ahead of PR99; do not publish earlier diagFiles store for this change. Files: engine mirrors, HTML mirrors, unit tests; browser test still needed.

PR100 opened: aa4fffd69c5e99239ef81536cdbe0bffca0e823d branch codex/lapp-four-core-cable. Full local npm run check completed successfully, log work/lapp-check.log. Browser fixture screenshot lapp-cable-library.png captures insertion and editable Properties; await exact-head CI and visual review before merge. No active local check session. PR99 production verified by build-info; its main CI handle43696559795 last seen in progress.

Initial PR100 CI failed only new browser test: expected8 data-terminal markers, received0. Model pins existed, renderer circles lacked terminal metadata. Fixed renderer with explicit A:/B: data-terminal circles and matching visible endpoint labels; kept assertion8. Published HTML-only follow-up on same branch. Await new exact-head CI and screenshot; no merge yet. Researched A3 enclosure separately in ENG-0601-enclosure-research.md.

PR100 final head fad400cc2b4dad55c2a26e1f8a2dd06c5cf1eab3 passed CI43696988863/43696985045. Artifact14155415533 cable screenshot reviewed: eight labelled endpoints, existing Properties, editable route. Merged; rollout verification next. Local Rittal work separate, see rittal-enclosure-library.md.

Production build-info confirmed PR100 merge2f2752b5c315cba81c83ca95c55b34e1da6aafca. Pages43697295624, mainCI43697295617. Interactive live check still pending; CI insertion/edit/reopen and screenshot passed. Next local Rittal definition remains unpublished.
