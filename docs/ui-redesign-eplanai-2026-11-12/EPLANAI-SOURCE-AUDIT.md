# Code-backed interface audit — 2026-11-12
**Project:** `HephzibahBehulahHQ/adigunEplanAI`; main `79853069438a271e686a73a518ce0e2edb423e07`; active compact-shell PR #39 (head at audit: `844a83d6b3e0f1f554e8b8666dc12b9f8c5e5cf8`).

| Finding | Exact source | Fix priority |
|---|---|---|
| Large blank lower area / page overflow | main `apps/web/src/workspace.css`: `.application{min-height:100dvh}`; `.engineering-layout{min-height:640px}`; `.workspace{min-height:420px}`; `.drawing-viewport{min-height:380px}` | P0: height-constrained app grid, footer pinned, panel interiors scroll |
| Unequal panel ends | `App.tsx` seven `panelIds`, `flexBasis:state.size` per panel; `.dock-left/.dock-right` flex-column; `.dock-bottom` participates as grid row | P0: full-height lanes for active dock panels, unify shared bottom; preserve hide/collapse/dock |
| Giant Home icon fonts and mixed labels | main `home-ribbon.css`: Home buttons 74px high and icons 25px, clipboard 19px; `data-icon-only` hides text | P0: uniform compact icons, text labels in flyouts, avoid extra ribbon |
| Menu category changes occupy room | main `App.tsx` `.ribbon`, `WorkspaceRibbon.tsx` 20 `ribbonTabs`, `HomeRibbon.tsx` modal workflows | P0: single stable compact bar + overlay flyouts |
| Shell already being redesigned | active PR #39 adds `workbench-shell.css`: 34px header / 36px toolbar, fixed popover, icon rails, document tabs | Continue PR #39; no parallel rewrite |
| Bottom row still consumes height in PR | PR #39 `workbench-shell.css` `.engineering-layout:has(>.dock-bottom){grid-template-rows:minmax(0,1fr) minmax(0,min(36dvh,280px))}` | P0: avoid reserving dead row when bottom dock inactive; controlled persistent bottom drawer when open |
| Popover flicker / poor positioning potential | PR #39 `App.tsx` `commandOpen`, `scheduleMenuClose` 180ms, `.workbench-command-popover` `left:min(32vw,420px)` | P0: anchor to active trigger; focus/pointer safe closing; viewport flip/clamp |
| No safe fake-feature short cuts | `docs/PROJECT_B_INTERFACE_TRANSFORMATION.md` forbids changing native engineering models or Project B | Preserve commands, model, CI and verified-runtime Pages pipeline |

**Screenshot interpretation:** owner screenshot shows original deployed main, not necessarily updated PR #39. The bot/panel columns are not intrinsically bad; the significant defect is differing heights, unnecessary reserved rows, overflow and an oversized contextual ribbon. **Explicit owner update permits a narrow UI-only revision of prior frozen baseline**, with before/after evidence and protected rollback.
