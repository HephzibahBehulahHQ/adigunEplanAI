# Approved workstation interface baseline

This document freezes the AdigunEplanAI interface structure across every project, page, and engineering view. The customer-approved workstation is the visual acceptance target; retain its proportions and placement as features are added.

## Reference authority

- Product visual reference: [`docs/references/target-workspace.png`](../references/target-workspace.png), recorded in `product.config.json` as the product interface.
- This canonical tracked image is the owner-approved interface reference; keep one authoritative copy and use the path recorded in `product.config.json`.
- Related approved shell pattern: [AdigunAiAutoCad workstation](https://github.com/HephzibahBehulahHQ/AdigunAiAutoCad). Use its layout and interaction pattern as guidance; do not copy its source code or assets.
- Source implementation: `apps/web/src/WorkspaceHeader.tsx`, `WorkspaceRibbon.tsx`, `App.tsx`, `workspace-header.css`, `home-ribbon.css`, and `workspace.css`.

## Frozen screen structure

Keep the same application header, navigation tabs, one-row command ribbon, left project/properties dock, central engineering sheet, right engineering/Adigun BOT workspace, bottom diagnostics/data panels, and status bar. Project and page changes update drawing data and panel contents inside this shell; they do not create a different shell or move its regions.

Preserve the approved logo treatment, wordmark and division label, corporate color tokens, icon alignment, toolbar order, panel locations, canvas bounds, ribbon height, and header/status-bar positions. Existing controls keep their commands and accessibility labels. Add future commands inside existing ribbon groups, menus, or panels. Do not add a toolbar row, resize the header, insert a new persistent rail, or allow a menu/ribbon to push or resize the drawing area. Long command groups scroll inside the ribbon. Floating menus overlay content without shifting it; provide labels/tooltips and close behavior consistent with the existing interface.

## Change and verification rule

Do not redesign, recolor, rearrange, or replace approved interface elements while implementing engineering milestones. Before any UI change, inspect this baseline and the current rendering. Keep application chrome geometry constant when changing ribbon categories, projects, pages, themes, or dock contents. Verify desktop layout and mobile overflow with the relevant browser tests. A new customer-approved reference or explicit owner decision is required to change this baseline.
