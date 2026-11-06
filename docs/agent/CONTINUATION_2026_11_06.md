# Continuation checkpoint — 2026-11-06

Read [the master specification](../MASTER_SPECIFICATION.md), [the product goal](PURSUED_GOAL.md), [current status](PROJECT_STATUS.md) and [acceptance limits](../MILESTONES_7_12_ACCEPTANCE.md). This checkpoint preserves the last confirmed work after the execution workspace became unavailable. It does not certify M13–M20 or recover unpublished files.

## Published source

PR #11 is merged as `17580877be2f4036137c8e832e213c580b870fab`, source tree `d9768e4802f86b01d01a6c331be0d8493e24309b`. It contains the PR #10 M7–M12 increment plus the cabinet BSP visibility correction, DXF and riser drawing exports, and document-language corrections. Both source CI runs passed; isolated source verification recorded 289 unit/tooling and 118 browser tests. The hosted release build additionally passed seven workflows against actual production output.

The release build is [42186682807](https://github.com/HephzibahBehulahHQ/adigunEplanAI/actions/runs/42186682807). Its candidate `e2c5da75f304cbf347f9006324a457814f0aac26` has the exact source above as its sole parent. Build and publication use separate read-only and scoped-write jobs. Only runtime distribution files changed; configuration, previous hashed assets and unrelated work were preserved. See the final deployment receipt in [production-domain.md](../deployment/production-domain.md).

## Offline exception and recovery validation

The execution workspace became unavailable on 2026-11-06. This exception covers only inaccessible local M13/example/readiness files; connected GitHub work remains online. New local feature work stopped. The last verified work-branch head is `7b4ea96adbe32c8a26810716e722c1fdc141f970` on `codex/m13-examples-release-continuation`. The unstaged files in that local checkout are synchronization pending and have no confirmed durable backup. A record describing them does not back up their contents.

Resume only after the execution environment is available: inspect and preserve the actual working tree, verify the remote head, reconcile without discarding changes, create a scoped WIP checkpoint and read its exact SHA back. Do not claim the five-minute cadence was satisfied for the unpublished work; the available evidence does not establish that.

Recovery validation remains **NOT TESTED** for the inaccessible WIP: normal five-minute cadence, failing-feature WIP publication, interruption during publication, concurrent-writer recovery, secret/unrelated-file exclusion injection, and fresh-checkout restoration. The hosted source release used exact-ref readback, guarded publication and a clean checkout, but that does not establish recovery of these unpublished files.

## Unpublished workspace: recover before editing

The local branch was `codex/m13-examples-release-continuation`, at canonical PR #11 candidate `7b4ea96adbe32c8a26810716e722c1fdc141f970`, with substantial unstaged changes. Do not reset, clean, overwrite or discard it. Its execution environment is unavailable, so file recovery and current contents are not verified. The following counts and tests describe the last confirmed local checkpoint, not published functionality.

### M13 BOT

The local assistant, floating window and gateway implementation passed 23 focused unit/security cases. The latest strict-persistence browser run passed 12 of 14 cases. Both remaining quota cases reached the rejected-write branch but stopped because the saved original project concealed the save-error alert; the later rollback assertions still need to run.

Pending one-line change in `apps/web/src/BotWindow.tsx`: render the error when `native.error` is present, removing the `!native.saved` condition. The attempted patch did not execute. Then rerun the complete 14-case BOT browser suite and rebuild the edge bundle with `scripts/build-bot-edge.mjs`.

Preserve private proposal previews, stale/replay guards, explicit authenticated acceptance, real selection context and no automatic engineering persistence. Existing-project acceptance uses `applyFromProposal`; project creation and reversal use the strict `createFromProposal` / `undoProjectCreation` APIs. Storage failure must leave project, history and successful receipts unchanged. Guest analysis/export remains available without authenticated persistence.

Gateway source is in `packages/assistant`, `supabase/functions/adiguneplanai-bot` and `supabase/schema/adiguneplanai-bot.sql`. No BOT Edge Function deployment is confirmed. Product-scoped server key/model configuration and genuine authenticated invocation remain unverified. Do not reuse another product's credentials. Account/product limits, verified nonanonymous identity, origin enforcement, service-role-only budget RPCs and honest unknown usage records must survive review.

### Examples: 233 authored/validated at the last checkpoint, not 500 released

| State                           | Categories                                                 | Count | Evidence                                                                                                                 |
| ------------------------------- | ---------------------------------------------------------- | ----: | ------------------------------------------------------------------------------------------------------------------------ |
| Registered local originals      | All eleven required categories                             |    50 | 1,654 authored checks, 73 focused unit tests, five browser workflows; 535 generated artifacts                            |
| Unregistered building expansion | Residential 53, commercial 45, lighting 36, low-voltage 32 |   166 | 167 focused tests, including every example and cross-library uniqueness                                                  |
| Unregistered panel expansion    | Cabinet 10, integrated 7                                   |    17 | 656 authored/native/export checks and domain TypeScript; focused regressions, formatting and visual review still pending |

No example source or generated artifact from this checkpoint has a confirmed external commit. The 166-example expansion is in `packages/example-projects/expansion/{building-matrix,building-examples,low-voltage}.ts` with `tests/examples/building-expansion.test.mjs`. The 17 panel/integrated additions are in `packages/example-projects/expansion/panel-integrated.ts`.

Remaining assigned additions: power 41, renewable 36, protection 32, motor 53, PLC 45, cabinet 35 and integrated 25: 267 projects. These are not implemented at this checkpoint. Register and publish only after individual native/engineering/export validation and representative visual workflows. Preserve the master specification's exact category totals and 150/300/500 acceptance gates; cosmetic variants do not count as distinct engineering projects.

The first 50 public artifacts were frozen after corrected cabinet rendering. The prepared native annotation wrapping helper still needs wiring into drawing export and the schematic renderer. Regenerate and validate example artifacts after that change. Add example tests and generated-artifact checks to CI; the published `npm test` currently covers only tooling/unit folders.

### Storage, history and readiness work

Unpublished cloud transport changes add bounded requests/bodies and timeout recovery without automatic write retries. Combined focused cloud/creation checks passed 16 cases. A streaming account-switch test should be inspected to ensure its owner change occurs during body consumption.

Unpublished history caches validated snapshot serialization/byte counts and introduces a private one-use prepared commit. Storage removes a redundant whole-library reparse while preserving validation and identity checks. Twenty-eight existing history/storage/account/deletion tests passed. Strict proposal creation has four focused cases covering owner/base/collision validation, immutable preparations, reversal, stale/replay rejection and preserved unrelated edits.

Performance improvement is not yet established. A reconstructed benchmark must run against both isolated published source and recovered work with the same fixture. Do not compare it as byte-identical to the earlier ad hoc benchmark. Browser performance budgets still need direct evidence.

`packages/reporting/annotation-layout.ts` and its two passing unit cases were prepared but not connected. Preserve explicit lines, Unicode, native positions and full text; render bounded SVG tspans and truthfully expose overflow rather than silently dropping notes.

## External and final acceptance gates

The history/avatar migration is applied, with read-only RLS/grant/bucket inspection and unauthenticated denials verified. Its rollback fixture did not execute because mandatory confirmation expired. Do not bypass that confirmation through another mutation route. A legitimate authenticated production REST/storage round trip remains required.

Engineering/manufacturer data rights, specified remaining geometry/interchange including STEP, native-language review, cross-browser/accessibility acceptance, complete 500-project evidence, hosted BOT acceptance, performance budgets and backup/restore evidence remain open. Revision history that cascades on project deletion is not independent disaster backup. M20 must remain incomplete until its actual release criteria are satisfied.
