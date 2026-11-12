# UI-001 — Project A Interface Transformation, Project B Visual Reference
## Owner-approved interface-first development specification — 2026-11-12

**Target and sole writable product repository (Project A):** https://github.com/HephzibahBehulahHQ/adigunEplanAI  
**Read-only visual reference (Project B):** https://github.com/HephzibahBehulahHQ/AdigunAiAutoCad  
**Project A master goal:** `AdidunEplanAI Master PlanGoals`  
**Project B reference brief:** `adigunaiautocad pursuing goal.md`  
**First deliverable:** A live, editable AdigunEplanAI interface with the approved *Project B* workstation shell. **No new engineering feature development is authorized within UI-001.**

### Immutable project boundaries
- **Never change Project B.** Do not create commits, branches, releases, PRs or configuration changes in `AdigunAiAutoCad`. It is a design and behavior reference only.
- All production code, engineering data, tests, specifications and deployment files belong to **Project A**.
- Keep Project A's React/TypeScript/Vite application, native electrical model, circuit connectivity, calculations, building editor, PLC editor, enclosure/panel tools, persistence, localization, accounts, report exporters and Adigun BOT intact. Never replace these with Project B's smaller static HTML/JavaScript application.
- Preserve **every Part 1–27 requirement**, existing project sample, milestone, safety gate, release test, API and existing project document; no deletion, silent scope reduction, or recreation from scratch.
- The previous EPLAN-oriented screenshot and expanded ribbon are superseded **for the application shell's visual acceptance only**. Project A's engineering-feature requirements remain authoritative.
- The approved corporate branding and external governance/design-system obligations still apply; do not copy proprietary visual assets, trademarks or vendor engineering data.

### Required visual geometry — copy Project B's interface architecture
At **1440 × 900 CSS pixels**, capture Project A and Project B with the same viewport and compare visible geometry, placement, spacing, colors, typography and controls. Use Project B's actual `index.html` styles and interaction implementation as the visual benchmark, implemented natively in React in Project A. Do not accept a vaguely similar layout.

1. **Single dark navy compact top bar (target 24–34px):** verified corporate branding, **AdigunEplanAI** wordmark, compact active project indicator, document tabs, minimal real save/account/notification/help controls. Existing account status must not be fabricated. Use a small + tab control for a real new document.
2. **Single narrow icon-first command bar (target 28–42px):** light gray/white background, dark pictograms, cyan highlights, thin group separators. File/New/Open/Save/Print; Undo/Redo; Select/Pan/Wire/Terminal/Junction/ground/motor; Zoom/Fit; electrical, PLC, building and panel workspaces; project/inspection/AI tools. Every enabled button must invoke an existing working command, otherwise visibly disable it with an explanation. No duplicated oversized ribbon, third header or permanently large labels.
3. **Collapsed left icon rail (target 32–44px):** project navigator, pages, symbol library, electrical, automation, building and panel workspaces. Clicking icons opens relevant *real Project A* docking panes or editor workspaces.
4. **Collapsed right icon rail (target 32–44px):** properties, diagnostics, calculations, cabinet/3D, BOM, reports, Adigun BOT, settings. Do not permanently occupy the canvas with inspector, BOT or other panels. Persistent panes may dock/resize, unlike transient menus.
5. **Large central white editable engineering sheet:** the real Project A schematic editor, not a screenshot or static SVG. Native electrical symbols, terminals, wires and labels must remain editable and connected. Drawing border, title block, grid, coordinate references, legibility and default fit-to-page should feel like Project B. Preserve dark/custom sheet themes as options, default to white for this interface. The central drawing viewport in collapsed-rail mode occupies **at least 75% of the available editor region**, calculated from real browser bounding boxes.
6. **Compact document/page tabs:** cyan active tab, actual view/page switching, genuine creation where supported, safe unsaved-state handling. Never spoof a tab with no backing document.
7. **Thin dark status bar (target 24–32px):** project/page, real coordinates when available, snap, grid, zoom when measurable, diagnostic status. Preserve existing useful status/diagnostic behavior.

### Global interaction invariant — GLOBAL-UI-UX-001
- **Click trigger → open anchored menu. Click again → close. Switch triggers → close previous/open new. Only one transient menu at once.**
- On desktop, pointer leaving the *combined trigger and flyout area* closes after a brief measured grace period; moving into the panel must not close it. On touch, tap outside closes; never depend on hover alone. Outside click, Escape, keyboard focus and ARIA controls must work.
- Flyouts appear **over** the canvas, never in normal page layout; no page/header/toolbar/workspace/sheet bounding rectangle may move or change size. Apply stacking contexts and viewport-constrained internal scroll.
- Distinguish transient flyouts from persistent docked editing panes and modal workflows. Selecting an actual command runs it and closes its transient flyout.
- Test at 1440×900 and 1920×1080, keyboard, narrow/touch viewports, mouseleave, switching, click-away, no clipping or canvas displacement.

### First milestone: deliver the interface, then STOP
1. Inspect the current state of both repositories, the source prompts and the owner screenshots. Read Project B only.
2. Establish current Project A build/test baseline and create a dedicated **Project A-only** branch. Do not commit to main before CI.
3. Replace Project A's *visible shell* with the Project B-style compact header, command bar, left/right rails, tabs and bottom status. Mount existing engineering editors unchanged beneath the new shell.
4. Connect visible icons/menus to existing verified native actions. Preserve access to less-frequently used controls via compact flyouts or expandable panes; do not drop commands.
5. Restore/verify native editable sample drawing, white sheet, large fitted viewport and clean reopen/save/undo/redo; do not invent electrical ratings or manufacturer data.
6. Run `npm run check`, `npm run test:e2e` and production browser checks where available. Capture before/after visual evidence and check layout bounding boxes.
7. Fix failures before publishing. Commit only verified changes, open PR, obtain required approvals and merge into Project A main. Deploy via Project A's existing authorized workflow and verify live site and native editing.
8. **STOP at the live UI-review gate.** The owner must see the merged deployed interface and explicitly accept it or request UI corrections. Do **not** resume the master engineering milestone roadmap or expand the engineering project library before approval.
9. Report only verified changes, tests, merge/deploy receipts, the deployed URL and any blockers. Never describe a draft PR as merged, or a mockup as the deployed application.

### Project A code map for the next agent
- `apps/web/src/App.tsx`: top-level shell, dock and ribbon composition, main canvas, status.
- `apps/web/src/WorkspaceHeader.tsx` + `workspace-header.css`: corporate branding, header utilities, document tabs.
- `apps/web/src/WorkspaceRibbon.tsx`, `HomeRibbon.tsx`: existing native commands; preserve handlers even if hidden inside compact popover.
- `apps/web/src/workbench-shell.css`: new isolated Project B-style shell overrides.
- `apps/web/src/NativeWorkspace.tsx`: real project navigator, tools, editable NativeDrawing and page tabs.
- `apps/web/src/SchematicEditor.tsx` + CSS: editable SVG, pin/net actions, viewport fitting. Existing internal controls can be offered in an expandable drawer, never discarded.
- `apps/web/src/preferences.ts`: existing saved layout preferences; preserve compatibility with previous users.
- `tests/e2e`, `tests/unit`: reuse native/project/browser tests; add shell-specific visual/interaction assertions.
- `docs/agent/PROJECT_STATUS.md` and `docs/agent/NEXT_TASKS.md`: keep engineering milestones queued behind owner UI approval.

### Current handoff checkpoint (do not mistake for released result)
The previous agent created Project A branch `codex/project-b-interface-first` and draft PR **#39**, containing an initial compact shell, new toolbar/rails, white canvas CSS and header document tabs. **This is unapproved work, not a finished visual match or deployment.** Initial CI failed formatting; a one-shot formatting workflow then corrected the files, but a subsequent CI run still needs verified success. Inspect latest run logs and PR head; fix real errors and regressions before merging. Compare against Project B visually, including menu anchor and overlay, and verify projects can be opened and edited. **Do not make any change in Project B.**

### Exit and continuation instructions
The user wants the **exact Project B interface architecture in Project A, nothing else at this milestone**. All full-application requirements from the master plan remain preserved for later. After verified PR merge and deployment, deliver the live URL and screenshots to the owner, then **STOP** until the owner explicitly approves the interface.
