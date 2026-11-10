# Decisions

- 2026-11-10: The owner reaffirmed the exact Eplan header/ribbon reference and explicitly made the repository template authoritative over the later guidance attachment. Keep native autosave/recovery. The owner's subsequent explicit refresh/close correction requires an empty active canvas on startup and a leaving guard for failed autosaves; saved project snapshots remain available only through explicit reopening. Use one header and one ribbon unit (tabs + grouped tools), with additional commands in their existing tabs or contextual dialogs.
- The approved header reference supplies the gold corporate mark: original PNG SHA-256 `6d6d33bb7534d01cbff3133a3d63fc0893f1c51f36c8e66531bca95d02cb4ec4`, rendered only through corporate viewport `6 12 254 56`. All text, project status, account controls and commands beside it are native UI. One-logo policy and authority pins remain enforced. Show actual application version, guest/session identity and local save status; never copy the reference's fictional Professional/cloud-saved claims.

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

- Schema version 2 adds explicit graphical layers, geometry/mirror metadata, groups and annotations; native version-1 projects migrate without changing engineering identities.
- Millimetres, inverse SVG transforms and native commands govern editing. The router checks device bodies, with bounded grid search for multi-turn paths. No electrical validation success is inferred from visual routing.
- Contextual properties are shown in the sidebar; Home exposes real project actions while View exposes layout controls. Native devices drive the inventory panel immediately.
