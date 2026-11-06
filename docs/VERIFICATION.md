# Milestone 0 verification

Passed: specification byte identity against supplied attachment; all 27 specification parts represented in feature matrix; relative Markdown link targets exist. Repository and tooling inventory executed; official logo SHA256 recorded. git diff --check executed before commit. Application tests/build not applicable: no runtime implementation in Milestone 0. Hosting, dependency compatibility and engineering behavior are not tested in this audit.

## Milestone 1

Executed npm run check: strict TypeScript check, ESLint, Prettier, 2 Node tooling tests, license metadata check over 144 lockfile entries and Vite production build all passed. npm audit --audit-level=moderate reports 0 vulnerabilities. Local installation used --workspaces=false due sandbox symlink restrictions; ordinary Linux workspace npm ci remains pending hosted CI. No ECAD/browser workflow is claimed by these foundation checks.

## Milestone 2

Six Node tests pass: license acceptance/rejection, bounded malformed preference restoration, independent preference round-trip, four-locale key completeness and canonical token fidelity. Seven Chromium tests pass in one final run: settings/theme/locale/background persistence, docking/keyboard resizing/collapse/visibility/reset persistence, help-dialog Escape behavior and mobile viewport overflow in each of en/de/yo/pcm. Browser findings fixed: explicit form labels and layout-menu state retention on docking. Desktop screenshot inspected at 1672×941. Type check, lint, format, license metadata and production build passed. Runtime React/React DOM/scheduler notices match installed upstream license text. Linux CI will also install Chromium and run the browser suite. Human translation review, full screen-reader audit and other browsers remain production gates.

## Milestone 3

Final npm run check passed: web/domain TypeScript checks, ESLint, Prettier, 27 Node unit/tooling tests, 148-entry license metadata gate, runtime notice fidelity and production build. All 11 Chromium scenarios passed in one final run. New native cases cover referential/shape constraints, invalid input preservation, version migration, undo/redo isolation/bounds, atomic library saves, quota failures and corruption preservation. Browser cases cover create/rename/pages/document-language/reload, import/export and replacement confirmation, raw recovery download/reset confirmation, and unsaved-work export under quota failure. No electrical simulation, general ECAD interchange or engineering certification is claimed by these model checks.

## Milestone 4

Frozen-source npm run check passed: web/domain TypeScript, ESLint, Prettier, 46 unit/tooling tests, 148 locked license entries, runtime notices and production build. All 21 Chromium scenarios passed. New cases exercise actual symbol/device/terminal creation, placement bounds/overlap, coordinate transforms, native wiring and rerouting, junction splitting, clipboard after deletion, cross-page grouping/paste, property/terminal labels, layer locking, zoom/pan/fit, desktop viewport fitting, each mobile locale, version-1 migration and saved-wire anchor enforcement. Routing reference cases include intervening body obstacles and a multi-turn maze that exercises bounded grid search. No electrical-simulation or manufacturer certification claim follows from editor tests.


## M7 schema 16: floor electrical integration (2026-11-06)

`npm run check` passed 171 unit/tooling tests, web/domain TypeScript, ESLint, formatting, licenses, notices and build. `npm audit --omit=dev --audit-level=high` reports zero vulnerabilities. The new tests validate floor-first device identity/pins, atomic failures, protected layers, migrations, circuit/member/load references, unknown load totals, independent route lengths, deletion guards and exact coordinate preservation when editing without snapping.

Two complete new browser workflows pass: create all four floor-device types, designate a board, assign circuit members and explicit/unknown loads, create routes, edit without unintended snapping, reject invalid changes, preserve hidden/locked data, undo/redo, download actual native JSON and reload. All 11 pre-existing building workflows also passed. The final full Chromium regression completed with 97 passed and zero failures, including all four mobile locales. Both new workflows also pass against the built application. Visual inspection caught and corrected white-on-white building labels and a German ribbon overflow; explicit theme surfaces and wrapping fix both. Circuit/route tables retain readable widths inside horizontal scroll containers on mobile.

Local browser validation uses repository Playwright 1.64.1 with recovered Chromium headless shell 141.0.7390.37 via a temporary config. The browser normally pinned to this Playwright release could not download locally; full Chrome also hit the environment's singleton-socket restriction. The standard headless shell launched normally; no repository dependency or sandbox/network policy changed. Hosted CI uses the configured Playwright browser. These local results do not establish other-browser or human-translation acceptance.

Production bundling separates React runtime and schema validation without changing the 500 kB warning threshold. Main: 203.56 kB; React runtime: 218.77 kB; schema validation: 91.91 kB. The building editor remains lazy loaded.


Hosted final-candidate evidence: `296bac8d5c4dfecd87b802868da66b7fc02d58f7` passed both push run 42171235299 and pull-request run 42171243149. The inspected PR job log confirms 171 tests, 97 browser scenarios and zero production vulnerabilities. The subsequent merge preserves exactly the candidate tree. Mobile schedule width was additionally verified in both built-app workflows without page overflow.

## Schema 17: M7–M12 continuation (2026-11-06)

An isolated source snapshot passed `npm run check`: 278 unit/tooling tests, web/domain TypeScript, ESLint, formatting, all 159 locked dependency-license entries, runtime notice fidelity and production build. Runtime notices now include the Supabase packages and their shipped dependencies. `npm audit --omit=dev --audit-level=high` reports zero vulnerabilities. Main bundle is 359.49 kB, account runtime 216.00 kB and React runtime 218.77 kB; no warning threshold increase.

The full isolated Chromium suite passed all 116 scenarios in one completed run. New workflows cover vertical risers/additional floor devices, all calculation controls and four locales, synchronized panel geometry and face features, PLC mappings, real SVG/PNG/PDF/CSV exports, account isolation/stale replies, cloud conflicts/history/recovery, registration/reset/profile/password states, anonymous rejection, bounded private avatars, offline owner storage and the compact truthful header. Deliberately blocked lazy-import tests exercise the existing error boundary; their expected console errors are not product-load failures.

Review reproduced and fixed last-symbol deletion of a device referenced by a PLC signal assignment or control note. Regression tests verify the retained device/terminals through atomic history, undo and native reload. CSV lint correction did not change output behavior. No real production account credentials or model key were used by mocked account/browser checks. The Supabase rollback security fixture was not executed because mandatory confirmation expired; live authenticated REST/storage remains a release gate.

The local browser version and environment limitations remain those recorded for schema 16. Hosted CI and live deployment evidence must be recorded against the canonical source commit separately. Later M13/example source remains outside this tested snapshot.
