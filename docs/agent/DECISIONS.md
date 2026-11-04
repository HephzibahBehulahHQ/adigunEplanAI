# Decisions

- Use hb-AI-policy for governance, hb-design-system for visual standards, and hb-elektroniker for engineering guidance, as directed by the owner.
- Keep implementation in HephzibahBehulahHQ/adigunEplanAI.
- Preserve the supplied interface screenshot as visual guidance; exact behavior and acceptance must come from the product specification.

- User granted standing authorization on 2026-11-02 to continue approved milestones without approval requests between them; this supersedes the specification's intermediate review stop instruction.
- Milestone 1 uses npm workspaces, React/Vite and shared strict TypeScript configuration. Domain packages will be added when implemented rather than scaffolding unused modules.
- TypeScript 6.0.3 is selected because typescript-eslint 8.72.1 does not support TypeScript 7. Windows sandbox blocks workspace links: local install uses --workspaces=false with centrally pinned build dependencies; Linux CI retains normal npm ci workspace linking.

- Pin minimatch 11.0.4 through npm overrides to address GHSA-g3hv-75wg-m249; lint and the full foundation gate pass with this version.

- GitHub connector publication is verified by comparing Git tree hashes; local intake history is retained separately. Foundation PR #1 head 9db77462dc9c620badf1227a5f966624c66385b0 has successful hosted CI.
- Milestone 2 exposes only implemented interface actions. Engineering panels use honest empty states until the native document model and tools exist. No dummy cloud/profile/BOT indicators are shown.

- Owner reconfirmed the attached target interface on 2026-11-02; see PURSUED_GOAL.md and docs/references/target-workspace.png. The corporate shell is an intermediate step toward that complete engineering workspace.

- Native project version 1 uses Zod 4.6.7 strict schemas, separated wire geometry, explicit reference checks and bounded JSON imports. Atomic browser-local storage is an adapter-backed first persistence implementation; cloud storage is deferred to its approved milestone.
- Undo/redo stores isolated validated snapshots rather than UI state. Corrupt local storage is preserved until explicit reset, with recovery download available.
- Docking-menu state is now controlled from explicit activation rather than asynchronous native toggle events; repeated local tests and both corrected hosted CI runs pass.
