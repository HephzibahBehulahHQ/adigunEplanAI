# Decisions

- Use hb-AI-policy for governance, hb-design-system for visual standards, and hb-elektroniker for engineering guidance, as directed by the owner.
- Keep implementation in HephzibahBehulahHQ/adigunEplanAI.
- Preserve the supplied interface screenshot as visual guidance; exact behavior and acceptance must come from the product specification.

- User granted standing authorization on 2026-11-02 to continue approved milestones without approval requests between them; this supersedes the specification's intermediate review stop instruction.
- Milestone 1 uses npm workspaces, React/Vite and shared strict TypeScript configuration. Domain packages will be added when implemented rather than scaffolding unused modules.
- TypeScript 6.0.3 is selected because typescript-eslint 8.72.1 does not support TypeScript 7. Windows sandbox blocks workspace links: local install uses --workspaces=false with centrally pinned build dependencies; Linux CI retains normal npm ci workspace linking.

- Pin minimatch 11.0.4 through npm overrides to address GHSA-g3hv-75wg-m249; lint and the full foundation gate pass with this version.
