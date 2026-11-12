## CURRENT OWNER-APPROVED GOAL — UI-001 (2026-11-12)

**FIRST DELIVERABLE: Project A must visually match Project B's compact CAD workstation.** This supersedes prior shell/ribbon screenshot guidance, not the original engineering feature requirements.

- **Only writable product:** `HephzibahBehulahHQ/adigunEplanAI` (Project A). **DO NOT MODIFY** `HephzibahBehulahHQ/AdigunAiAutoCad` (Project B): read-only visual reference.
- **Before code:** read [Project B interface transformation and next-agent handoff](docs/PROJECT_B_INTERFACE_TRANSFORMATION.md), the [master pursuing goal](AdidunEplanAI%20Master%20PlanGoals), and the actual Project B reference `index.html` / pursuing goal.
- **Scope now:** replace only the shell visuals and relevant interactions: slim header/document tabs, compact icon bar, 32–44px left/right icon rails, true overlay menus, large white editable Project A schematic canvas, thin status bar. Preserve all native project models/editors and the full master goal.
- **Current WIP:** `codex/project-b-interface-first`, draft PR #39. Validate and fix this existing branch; **do not restart from scratch**. Initial CI failed formatting; verify the latest CI after the one-time Prettier correction and resolve any subsequent errors.
- **Ship and STOP:** Playwright visual/interaction checks, native engineering save/reopen regression, `npm run check`, CI and production checks → approved merge/deploy/verify → stop for explicit owner visual approval. Do not implement unrelated engineering features in this phase.
- Do not describe an unapproved PR, mocked example, UI screenshot, or failed build as completed/deployed.
- **No new permissions to bypass safety policy or existing repo approvals.**

# AdigunEplanAI agent guidance

Read the README, active product specification and docs/agent records before implementation.

Authority:
- Governance: [HB-AI-ENGINEERING-001 v2.0](https://github.com/HephzibahBehulahHQ/hb-AI-policy/tree/d42d4e04ac6ab77ebafa1d4fccb724a4dde8d02e). Adoption recorded 2026-11-06 UTC for this product under the owner's instruction to follow the canonical repository/template authorities; product owner: HephzibahBehulahHQ. This immutable pin is repository-scoped, respects the actual instruction hierarchy and standing owner authorization, and changes only through an explicit recorded adoption decision.
- Design: https://github.com/HephzibahBehulahHQ/hb-design-system
- Engineering: https://github.com/HephzibahBehulahHQ/hb-elektroniker

Keep all product code, tests and deployment files in this repository. Preserve existing work. Use small branches and milestones, test relevant behavior, commit verified changes and maintain the agent records. Use one agent by default. Routine development calls for GPT-6.1 Sol with Medium reasoning; calculations, connectivity, CAD geometry, security and difficult debugging call for High. Never claim an unavailable model switch.

The product specification determines exact scope and milestone acceptance. Do not invent an approved specification. Do not advertise unavailable features or fabricated test counts.


# GLOBAL CODEX OPERATING DIRECTIVE
## STRICT TOKEN DISCIPLINE, NETWORK EFFICIENCY & AUTONOMOUS PROJECT EXECUTION

**SCOPE: ALL PROJECTS, REPOSITORIES, TASKS, AND WORKSPACES.**

**PRIMARY OBJECTIVE:** Minimize unnecessary token consumption, prevent repetitive operations, maintain security, and complete projects efficiently without sacrificing quality.

### 1. MANDATORY TOKEN DISCIPLINE

1. Never repeat conversation history, instructions, specifications, or completed work.
2. Never paste raw PDFs, HTML dumps, excessive terminal logs, or entire files into context.
3. Convert large documents into concise Markdown only when necessary.
4. Treat existing `.txt` and clean Markdown as ready to process.
5. Read only relevant files and sections. Never repeatedly scan entire repositories.
6. Reuse existing project plans, decisions, cached information, and progress records.
7. Show only modified code or filenames unless complete files are requested.
8. Avoid unnecessary reasoning, sub-agents, repeated tool calls, and excessive computer interactions.
9. Use the lowest-cost suitable model and reasoning effort available.
10. Never repeat successful operations without a justified reason.
11. Keep responses concise, factual, and action-oriented.

### 2. NETWORK ACCESS & TOKEN EFFICIENCY

1. Keep network access restricted by default, but allow necessary connections for project execution.
2. Support authorized services such as GitHub, Supabase, Cloudflare, Azure, AWS, Vercel, databases, APIs, package registries, and deployment platforms.
3. Before requesting network approval, briefly state the destination, command, and purpose.
4. Do not repeatedly request approval for operations already covered by valid permissions.
5. Prefer targeted network requests over full downloads or excessive API responses.
6. Reuse installed dependencies, cached resources, and authenticated sessions.
7. Batch related network operations when safe and permitted.
8. Limit terminal and network output to relevant information.
9. Retry failed network operations no more than twice automatically.
10. Avoid unnecessary browsing and repeated documentation searches.
11. Never bypass sandbox protections, authentication, or security requirements.
12. Never expose passwords, API keys, credentials, or access tokens.
13. Obtain explicit approval for financial commitments, destructive actions, or irreversible changes.

**Network approval must never become a reason to restart analysis, reread the entire repository, or repeat completed operations.**

### 3. AUTONOMOUS PROJECT CONTINUATION

1. Continue every project from its actual current state.
2. Follow existing project specifications, architecture, templates, and implementation plans.
3. Never restart completed tasks without a verified reason.
4. Break large objectives into focused, executable tasks.
5. Execute tasks autonomously within existing permissions.
6. Request additional permission only when genuinely required.
7. Do not repeatedly ask for general authorization to continue.
8. Modify only relevant files.
9. Run targeted tests before broader test suites.
10. Fix verified failures without introducing unrelated changes.
11. Preserve working functionality and existing configurations.
12. Commit and synchronize verified changes when appropriate.
13. Continue through implementation, integration, testing, and deployment as required.
14. Never claim a task is complete without verifying the result.

### 4. TOKEN USAGE MONITORING

1. Minimize unnecessary context expansion.
2. Avoid repeated builds, installations, downloads, and deployments.
3. Monitor available usage information around expensive operations.
4. Investigate unexpected usage spikes using small, bounded tests.
5. Distinguish permission approvals from subsequent model and tool activity.
6. Stop repeated failing operations and diagnose the actual cause.
7. Maintain concise project progress records for efficient continuation.
8. Prioritize productive execution over lengthy commentary.
9. Do not compromise correctness, required testing, or security merely to save tokens.

### 5. EXECUTION AND COMMUNICATION RULES

- Execute first; report verified results afterward.
- No filler, lengthy introductions, repeated plans, or unnecessary explanations.
- Never paste entire source files unless explicitly requested.
- Never invent progress, test outcomes, or completion times.
- Report only what changed, what was tested, what is blocked, and what comes next.
- Use evidence-based time estimates; otherwise state "Not yet determined."
- Continue working within authorized permissions without repeatedly seeking general approval.

### 6. MANDATORY RESPONSE FORMAT — EVERY TURN

**STATUS**

**Done:** Actual completed changes.

**Tested:** Passed / Failed / Not run.

**BLOCKED:** Specific blocker or None.

**ESTIMATED FINISH TIME:** Evidence-based estimate or Not yet determined.

**ETA:** Remaining duration or Not yet determined.

**Next:** One concise line describing the immediate next action.

**Nothing else unless explicitly requested.**

### 7. PERMANENT GLOBAL PRIORITY

**STOP TOKEN WASTAGE. EXECUTE EFFICIENTLY. CONTINUE PROJECTS. PRESERVE SECURITY. VERIFY RESULTS. COMPLETE AND DEPLOY.**

Apply this directive to **every project and task**, regardless of repository, programming language, framework, cloud provider, or development environment.

These instructions remain active wherever they have been configured until explicitly revised.


## Approved workstation interface is frozen

Follow [the interface baseline](docs/agent/INTERFACE_BASELINE.md) for every application and project view. Keep the approved header, single-row ribbon, dock/canvas arrangement, status bar, design tokens, and relative geometry intact. Put future commands inside existing UI regions; do not add rows or bars or let menus shift the drawing area. Run the workstation geometry regression before accepting interface changes. Change this baseline only with an explicit owner-approved design decision.


## Owner-approved 2026-11-12 UI alignment override — EPLANAI_WORKBENCH_V2_START_NOW

The owner explicitly requested an additional, **interface-only** correction to the previously frozen workstation geometry. This narrowly authorizes correcting the old application's wasted lower space, mismatched dock heights, oversized/mixed command icons and non-floating menus. The earlier baseline remains the rollback reference, not a reason to reject this specific owner instruction.

**P0 instruction:** Continue existing draft PR #39 in `codex/project-b-interface-first` from its current tip. Read [the named implementation pack](docs/ui-redesign-eplanai-2026-11-12/README.md), especially the master prompt and two approved concept SVGs. All visible docked panels must end immediately above the status bar; menus are transient overlays and must never move the underlying canvas. Retain all native engineering, project/account, localization, 3D and BOT functions. Apply GLOBAL-UI-UX-001 to transient menus only; never mouseleave-close persistent editing panels or modal workflows. Run actual browser geometry/menu tests and CI. Use the repository's verified-runtime publication workflow only after owner review and successful source checks. Do not modify the other projects or create a competing implementation branch.

**Trigger delivery limitation:** GitHub/Codex integration must acknowledge a task before work is considered started; repository instructions alone do not force-start an agent.
