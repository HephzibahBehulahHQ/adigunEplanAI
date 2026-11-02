# Milestones

- 0: repository and feasibility audit complete.
- 1: application foundation published; hosted CI passed.
- 2: corporate interface published; hosted CI passed.
- 3: versioned native projects/persistence/validation/migration/undo-redo published; hosted CI passed.
- 4: 2D schematic tools published in PR #4; local and hosted CI passed.
- 5: published in PR #5; both hosted CI runs passed. See MILESTONE_5_ACCEPTANCE.md for scope and evidence.
- 6: implementation verified and published in draft PR #6; final hosted runs 41544056477 and 41544045519 passed. See MILESTONE_6_ACCEPTANCE.md for retained integration requirements.
- 7: in progress; native building/floor creation and rectangular room outlines are implemented and locally tested.
- 8–20: pending; MASTER_SPECIFICATION.md Part 22 is authoritative.

The owner authorizes continuous approved milestone execution. The full targeted engineering platform remains the goal; milestone completion is not final product acceptance.

Milestone 13 scope extension: the complete owner-supplied live co-pilot addendum is preserved in docs/specifications/ADIGUN_BOT_LIVE_COPILOT.txt and linked from PURSUED_GOAL.md. It requires proactive live canvas awareness, non-blocking suggestions/questions/explanations, accepted previewable reversible changes, guest assistance, authenticated explicit persistence, cooldown/edit suppression, tests and HELP documentation. Keep the master roadmap and all other requirements intact.

Milestone 13 floating-window extension: preserve and implement docs/specifications/ADIGUN_BOT_FLOATING_WINDOW.txt in addition to the live co-pilot addendum. Acceptance includes non-modal desktop canvas interaction; drag/resize and viewport bounds; minimize/maximize/restore/close/reopen; user-scoped layout persistence; unread/suggestion badges without automatic opening/focus theft; keyboard/ARIA/touch/mobile behavior; every listed test; and the HELP section/TOC. The later owner instruction supersedes fixed BOT positioning in the screenshot. Account layout storage belongs to the authenticated Supabase integration; engineering-action persistence rules remain intact.

Owner-approved top-right menu requirement: the active AdigunEplanAI header must use Saved locally → profile/status dot → compact language → settings → search → help, with equal square buttons, normal-flow flex spacing and no desktop/mobile overlap. Profile tooltip and true session-derived green/guest-gray dots are mandatory. Header/state ownership was inspected and reported before implementation; no auth state currently exists. Complete the interface work together with real account integration in Milestone 12 and provide changed JSX/CSS plus responsive and authentication-state verification. See PURSUED_GOAL.md.
